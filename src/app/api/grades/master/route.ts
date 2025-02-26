import { NextResponse } from 'next/server'
import { defaultGrades } from '@/lib/default-grades'

export async function GET() {
  try {
    return NextResponse.json({ grades: defaultGrades })
  } catch (error) {
    console.error('Failed to get master grades:', error)
    return NextResponse.json(
      { error: 'Failed to get master grades' },
      { status: 500 }
    )
  }
}
