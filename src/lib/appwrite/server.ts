import { Client, Databases, Storage, Users, ID } from 'node-appwrite'

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '')

export const databases = new Databases(client)
export const storage = new Storage(client)
export const users = new Users(client)
export { ID }
