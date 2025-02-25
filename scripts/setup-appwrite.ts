import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local before importing setup-appwrite
const result = dotenv.config({ path: resolve(__dirname, '../.env.local') })

if (result.error) {
  console.error('Error loading .env.local file:', result.error)
  process.exit(1)
}

// Manually set environment variables from result.parsed
if (result.parsed) {
  process.env.APPWRITE_ENDPOINT = result.parsed.APPWRITE_ENDPOINT
  process.env.APPWRITE_PROJECT_ID = result.parsed.APPWRITE_PROJECT_ID
  process.env.APPWRITE_API_KEY = result.parsed.APPWRITE_API_KEY
}

// Debug: Print loaded environment variables
console.log('Environment variables loaded:', {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  API_KEY_LENGTH: process.env.APPWRITE_API_KEY?.length || 0,
})

// Import setup-appwrite after environment variables are set
import { setupAppwrite } from '../src/lib/setup-appwrite'

async function main() {
  console.log('Starting Appwrite setup...')

  try {
    const result = await setupAppwrite()

    if (result.success) {
      console.log('\nSetup completed successfully!')
      console.log('\nDetails:')
      result.results.forEach((msg) => console.log(`- ${msg}`))
    } else {
      console.error('\nSetup failed!')
      console.error('Error:', result.error)
      console.log('\nPartial results:')
      result.results.forEach((msg) => console.log(`- ${msg}`))
      process.exit(1)
    }
  } catch (error) {
    console.error('\nSetup failed with an unexpected error:')
    console.error(error)
    process.exit(1)
  }
}

main()
