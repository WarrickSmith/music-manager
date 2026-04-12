import { Client, Databases, Storage, Users, ID, Query } from 'node-appwrite'

// Initialize the Appwrite client with proper error handling
function createAppwriteClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    console.error('Missing required Appwrite environment variables')
    throw new Error(
      'Appwrite configuration incomplete. Check your environment variables.'
    )
  }

  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
}

// Create and export service instances with error handling
let _client: Client
try {
  _client = createAppwriteClient()
} catch (error) {
  console.error('Failed to initialize Appwrite client:', error)
  // Set a placeholder client that will throw appropriate errors when used
  _client = new Client()
}

export const client = _client
export const databases = new Databases(client)
export const storage = new Storage(client)
export const users = new Users(client)
export { ID, Query }
