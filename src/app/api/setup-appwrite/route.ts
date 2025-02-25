import { NextResponse } from 'next/server'
import { setupAppwrite } from '@/lib/setup-appwrite'

export async function POST() {
  try {
    const result = await setupAppwrite()

    if (result.success) {
      return NextResponse.json(
        { message: 'Setup completed successfully', details: result.results },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          message: 'Setup failed',
          error: result.error,
          details: result.results,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Setup failed', error },
      { status: 500 }
    )
  }
}
