import { Client, Account, Databases, Storage, ID } from 'appwrite'
import { Client as ServerClient, Users } from 'node-appwrite'

// Client-side SDK configuration
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)

// Server-side SDK configuration
const serverClient = new ServerClient()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string)
  .setKey(process.env.APPWRITE_SECRET_KEY as string)

// Client-side exports
let accountInstance: Account | null = null
export const getAccount = () => {
  if (!accountInstance) {
    accountInstance = new Account(client)
  }
  return accountInstance
}

export const databases = new Databases(client)
export const storage = new Storage(client)
export { ID }

// Server-side exports
export const users = new Users(serverClient)
