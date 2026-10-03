import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFakeState,
  createFakeTablesDB,
  type FakeState,
} from './fake-appwrite'

let state: FakeState

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/appwrite/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/appwrite/server')>()
  return {
    ...actual,
    tablesDB: new Proxy(
      {},
      {
        get: (_target, prop) =>
          createFakeTablesDB(state)[
            prop as keyof ReturnType<typeof createFakeTablesDB>
          ],
      }
    ),
    storage: {},
  }
})

vi.mock('@/lib/auth/auth-service', () => ({
  getCurrentUser: async () => ({
    $id: 'u1',
    name: 'Mia',
    email: 'm@x.io',
    labels: ['competitor'],
  }),
}))

vi.mock('@/lib/appwrite/initialization-core', () => ({
  checkAppwriteInitialization: async () => ({ isInitialized: true }),
}))

vi.stubEnv('APPWRITE_DATABASE_ID', 'MusicManagerDB')
vi.stubEnv('APPWRITE_GRADES_COLLECTION_ID', 'grades')

const { getGradesForCompetition, getGradeCategoriesForCompetition } =
  await import('@/app/actions/competition-actions')

// A competition seeded from the default template has ~80 grades
function seedGrades(competitionId: string, count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({
    $id: `grade-${competitionId}-${i}`,
    name: 'Singles',
    category: `Category ${i}`,
    segment: 'Free Skate',
    competitionId,
  }))
  state.tables.get('MusicManagerDB/grades')!.rows.push(...rows)
}

beforeEach(() => {
  state = createFakeState()
  state.databases.add('MusicManagerDB')
  state.tables.set('MusicManagerDB/grades', {
    name: 'grades',
    permissions: [],
    columns: new Map(),
    indexes: new Map(),
    rows: [],
  })
})

describe('grade lookups', () => {
  it('returns every grade, not just the first page of 25', async () => {
    seedGrades('comp-1', 130)
    seedGrades('comp-2', 5)

    const grades = await getGradesForCompetition('comp-1')

    expect(grades).toHaveLength(130)
  })

  it('filters grades by category', async () => {
    seedGrades('comp-1', 80)

    const grades = await getGradesForCompetition('comp-1', 'Category 42')

    expect(grades.map((g: { $id: string }) => g.$id)).toEqual([
      'grade-comp-1-42',
    ])
  })

  it('collects categories from every grade', async () => {
    seedGrades('comp-1', 80)

    const categories = await getGradeCategoriesForCompetition('comp-1')

    expect(categories).toHaveLength(80)
  })
})
