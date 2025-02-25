import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

interface MasterGrade {
  name: string
  category: string
  segment: string | null
  section: string
}

function parseMasterGradesFile(): MasterGrade[] {
  try {
    const filePath = join(process.cwd(), 'NZIFSA Grades.txt')
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    const grades: MasterGrade[] = []
    let currentCategory = ''
    let currentSection = ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines and headers
      if (
        !trimmedLine ||
        trimmedLine.startsWith('**Updated') ||
        trimmedLine.startsWith('*Based')
      ) {
        continue
      }

      // Check for main category header (###)
      if (trimmedLine.startsWith('### ')) {
        currentCategory = trimmedLine.replace('### ', '').trim()
        currentSection = currentCategory // Default section to category
        continue
      }

      // Check for section header (**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        currentSection = trimmedLine.replace(/\*\*/g, '').trim()
        continue
      }

      // Process grade lines (starting with -)
      if (trimmedLine.startsWith('- ')) {
        const gradeName = trimmedLine.replace('- ', '').trim()

        // Handle different grade formats
        if (
          gradeName.includes('Short Program') ||
          gradeName.includes('Free Skate')
        ) {
          const [name, segment] = gradeName
            .split(/(Short Program|Free Skate)/)
            .map((s) => s.trim())
          grades.push({
            name: name.replace(/\s+$/, ''), // Remove trailing spaces
            category: currentCategory,
            section: currentSection,
            segment: segment,
          })
        } else {
          grades.push({
            name: gradeName,
            category: currentCategory,
            section: currentSection,
            segment: null,
          })
        }
      }
    }

    return grades
  } catch (error) {
    console.error('Error parsing master grades file:', error)
    throw error
  }
}

export async function GET() {
  try {
    const grades = parseMasterGradesFile()
    return NextResponse.json({ grades })
  } catch (error) {
    console.error('Failed to get master grades:', error)
    return NextResponse.json(
      { error: 'Failed to get master grades' },
      { status: 500 }
    )
  }
}
