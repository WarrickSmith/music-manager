import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  session: null as null | {
    $id: string
    name: string
    email: string
    labels: string[]
  },
  touched: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))
vi.mock('@/lib/auth/auth-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/auth-service')>()),
  getCurrentUser: async () => m.session,
}))
// Any call into Appwrite means a guard let a caller through
vi.mock('@/lib/appwrite/server', () => {
  const touch = () =>
    new Proxy(() => undefined, {
      get: (_t, prop) => (prop === 'then' ? undefined : touch()),
      apply: () => {
        m.touched()
        throw new Error('Appwrite was reached')
      },
    })
  return {
    tablesDB: touch(),
    storage: touch(),
    users: touch(),
    account: touch(),
    ID: { unique: () => 'id' },
    Query: new Proxy({}, { get: () => () => 'q' }),
  }
})
vi.mock('@/lib/appwrite/initialization-core', () => ({
  checkAppwriteInitialization: async () => {
    m.touched()
    throw new Error('Appwrite was reached')
  },
  initializeAppwrite: async () => {
    m.touched()
    throw new Error('Appwrite was reached')
  },
}))

for (const [k, v] of Object.entries({
  APPWRITE_DATABASE_ID: 'db',
  APPWRITE_BUCKET_ID: 'bucket',
  APPWRITE_COMPETITIONS_COLLECTION_ID: 'competitions',
  APPWRITE_GRADES_COLLECTION_ID: 'grades',
  APPWRITE_MUSIC_FILES_COLLECTION_ID: 'musicfiles',
})) {
  vi.stubEnv(k, v)
}

type Fn = (...args: unknown[]) => Promise<unknown>
type Policy = 'admin' | 'user' | 'self-or-admin' | 'public'

const competition = await import('@/app/actions/competition-actions')
const grade = await import('@/app/actions/grade-actions')
const music = await import('@/app/actions/music-file-actions')
const user = await import('@/app/actions/user-actions')
const entry = await import('@/app/actions/entry-actions')
const init = await import('@/lib/appwrite/initialization-service')
const auth = await import('@/app/actions/auth-actions')

/** Every exported action, with the policy it must enforce and dummy arguments */
const POLICY: Record<string, Record<string, [Policy, unknown[]]>> = {
  competition: {
    getCompetitions: ['admin', []],
    createCompetition: [
      'admin',
      [{ name: 'x', year: 2026, active: true, useDefaultGrades: false }],
    ],
    updateCompetitionStatus: ['admin', ['c1', true]],
    deleteCompetition: ['admin', ['c1']],
    updateCompetitionDeadline: ['admin', ['c1', null]],
    getActiveCompetitions: ['user', []],
    getGradesForCompetition: ['user', ['c1']],
    getGradeCategoriesForCompetition: ['user', ['c1']],
    getCompetitionDeadlines: ['user', []],
  },
  grade: {
    getGradesByCompetition: ['admin', ['c1']],
    createGrade: [
      'admin',
      [{ name: 'a', category: 'b', segment: 'c', competitionId: 'c1' }],
    ],
    updateGrade: ['admin', ['g1', { name: 'a' }]],
    deleteGrade: ['admin', ['g1']],
  },
  music: {
    getUserMusicFiles: ['self-or-admin', ['victim']],
    getAllMusicFiles: ['admin', []],
    findExistingMusicFile: ['user', ['g1']],
    deleteMusicFile: ['user', ['row1']],
  },
  user: {
    getAllUsers: ['admin', []],
    updateUserRole: ['admin', ['victim', 'admin']],
    updateUserStatus: ['admin', ['victim', false]],
    deleteUser: ['admin', ['victim']],
    getCurrentUserProfile: ['user', []],
    updateUserProfile: ['user', [{ name: 'x' }]],
    changePassword: ['user', ['old-password', 'new-password-1']],
    getUserProfile: ['self-or-admin', ['victim']],
    updateCompetitorProfile: [
      'self-or-admin',
      ['victim', { firstName: 'a', lastName: 'b' }],
    ],
    getServerSession: ['public', []],
  },
  entry: {
    getEntryOverview: ['admin', ['c1']],
    addEntries: [
      'admin',
      [{ competitionId: 'c1', userId: 'u', gradeIds: ['g'] }],
    ],
    removeEntry: ['admin', ['e1']],
    getOutstandingMusic: ['self-or-admin', ['victim']],
    listCompetitors: ['admin', []],
  },
  init: {
    checkAppwriteInitialization: ['admin', []],
    initializeAppwrite: ['admin', []],
  },
  auth: {
    loginAction: ['public', []],
    registerAction: ['public', []],
    logoutAction: ['public', []],
  },
}

const MODULES: Record<string, Record<string, unknown>> = {
  competition,
  grade,
  music,
  user,
  entry,
  init,
  auth,
}

const SIGNED_OUT = null
const COMPETITOR = {
  $id: 'mallory',
  name: 'Mallory',
  email: 'm@x.io',
  labels: ['competitor'],
}

/** Denied means it threw an AuthError or returned a failure result */
async function outcome(fn: Fn, args: unknown[]) {
  try {
    const result = (await fn(...args)) as
      | { ok?: boolean; success?: boolean }
      | undefined
    const failed =
      result != null &&
      typeof result === 'object' &&
      (result.ok === false || result.success === false)
    return failed ? 'denied' : 'allowed'
  } catch (error) {
    return (error as Error).name === 'AuthError' ? 'denied' : 'allowed'
  }
}

beforeEach(() => {
  m.touched.mockClear()
  m.session = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('server action policy', () => {
  it('classifies every exported action, so a new one cannot skip the policy', () => {
    for (const [name, mod] of Object.entries(MODULES)) {
      const exported = Object.entries(mod)
        .filter(([, v]) => typeof v === 'function')
        .map(([k]) => k)
        .sort()
      expect(Object.keys(POLICY[name]).sort(), name).toEqual(exported)
    }
  })

  for (const [name, actions] of Object.entries(POLICY)) {
    for (const [action, [policy, args]] of Object.entries(actions)) {
      if (policy === 'public') continue
      const fn = MODULES[name][action] as Fn

      it(`${name}.${action} (${policy}) refuses signed-out callers`, async () => {
        m.session = SIGNED_OUT
        expect(await outcome(fn, args)).toBe('denied')
        expect(m.touched).not.toHaveBeenCalled()
      })

      if (policy === 'admin' || policy === 'self-or-admin') {
        it(`${name}.${action} (${policy}) refuses a competitor acting on someone else`, async () => {
          m.session = COMPETITOR
          expect(await outcome(fn, args)).toBe('denied')
          expect(m.touched).not.toHaveBeenCalled()
        })
      }
    }
  }
})
