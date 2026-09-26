import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The legacy Databases API (collections/attributes/documents) needs API key
 * scopes that Appwrite 1.8+ no longer offers for new keys, so the app must
 * only use TablesDB. This guards against it creeping back in.
 */
const roots = ['src', 'scripts']
const legacyPatterns = [
  /\bnew Databases\(/,
  /\bdatabases\.\w+\(/,
  /\b(listDocuments|getDocument|createDocument|updateDocument|deleteDocument)\(/,
  /\b(getCollection|createCollection|listAttributes)\(/,
  /\bcreate\w*Attribute\(/,
  /\bModels\.(DefaultDocument|Document|DocumentList)\b/,
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

describe('Appwrite API usage', () => {
  it('does not use the deprecated Databases API', () => {
    const offenders = roots.flatMap(sourceFiles).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ file, line: index + 1, text: line }))
        .filter(({ text }) => legacyPatterns.some((p) => p.test(text)))
        .map(({ file, line, text }) => `${file}:${line}: ${text.trim()}`)
    )

    expect(offenders).toEqual([])
  })
})
