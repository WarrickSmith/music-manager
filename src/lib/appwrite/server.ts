import {
  Client,
  TablesDB,
  Storage,
  Users,
  ID as AppwriteID,
  Query,
} from 'node-appwrite'

interface AppwriteServices {
  client: Client
  tablesDB: TablesDB
  storage: Storage
  users: Users
}

let cachedServices: AppwriteServices | null = null

function requireEnv(name: 'APPWRITE_ENDPOINT' | 'APPWRITE_PROJECT_ID' | 'APPWRITE_API_KEY') {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required Appwrite environment variable: ${name}`)
  }

  return value
}

export function getAppwriteEndpointConfig() {
  return {
    endpoint: requireEnv('APPWRITE_ENDPOINT'),
    projectId: requireEnv('APPWRITE_PROJECT_ID'),
  }
}

export function createProjectClient() {
  const { endpoint, projectId } = getAppwriteEndpointConfig()
  return new Client().setEndpoint(endpoint).setProject(projectId)
}

function createAdminClient() {
  const { endpoint, projectId } = getAppwriteEndpointConfig()
  const apiKey = requireEnv('APPWRITE_API_KEY')

  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
}

function getServices() {
  if (cachedServices) {
    return cachedServices
  }

  const client = createAdminClient()

  cachedServices = {
    client,
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    users: new Users(client),
  }

  return cachedServices
}

function createLazyService<T extends object>(resolver: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const target = resolver()
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
    set(_target, prop, value, receiver) {
      return Reflect.set(resolver(), prop, value, receiver)
    },
    has(_target, prop) {
      return Reflect.has(resolver(), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(resolver())
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(resolver(), prop)
      if (!descriptor) {
        return undefined
      }

      return {
        ...descriptor,
        configurable: true,
      }
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(resolver())
    },
  })
}

export const client = createLazyService(() => getServices().client)
export const tablesDB = createLazyService(() => getServices().tablesDB)
export const storage = createLazyService(() => getServices().storage)
export const users = createLazyService(() => getServices().users)
export const ID = AppwriteID
export { Query }
