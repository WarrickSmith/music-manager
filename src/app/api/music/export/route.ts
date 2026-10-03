import { NextResponse } from 'next/server'
import { Zip, ZipDeflate, ZipPassThrough } from 'fflate'
import { storage, Query } from '@/lib/appwrite/server'
import { listAllRows } from '@/lib/appwrite/rows'
import { getAdminUser } from '@/lib/auth/guards'
import {
  isExportOrder,
  manifestCsv,
  planExport,
  zipFileName,
  type ExportFile,
} from '@/lib/music/export-plan'

// A zip of many audio files takes a while to build, and must not be cut short
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const bucketId = () => process.env.APPWRITE_BUCKET_ID!
const musicFilesTable = () => process.env.APPWRITE_MUSIC_FILES_COLLECTION_ID!

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Admin-only download of one competition's music as a zip, numbered in running
 * order with a manifest.csv. Add preflight=1 to get the file count, total size
 * and zip name as JSON instead, so the screen can show problems before the
 * download starts.
 *
 * The zip is streamed one file at a time, so memory use stays at about one
 * audio file however large the event is.
 */
export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return json({ error: 'Only admins can export music.' }, 403)
  }

  const params = new URL(request.url).searchParams
  const competitionId = params.get('competitionId')
  const order = params.get('order') ?? 'grade'
  if (!competitionId) return json({ error: 'Choose a competition.' }, 400)
  if (!isExportOrder(order)) {
    return json({ error: 'The order must be "grade" or "segment".' }, 400)
  }

  let rows
  try {
    rows = await listAllRows(musicFilesTable(), [
      Query.equal('competitionId', competitionId),
    ])
  } catch (error) {
    console.error('Export: could not list music files:', error)
    return json(
      {
        error: `Could not load the music files: ${error instanceof Error ? error.message : String(error)}`,
      },
      500
    )
  }
  if (rows.length === 0) {
    return json(
      { error: 'No music has been uploaded for this competition yet.' },
      404
    )
  }

  const plan = planExport(rows as unknown as ExportFile[], order)
  const first = rows[0]
  const filename = zipFileName(
    first.competitionName,
    first.competitionYear,
    order
  )

  if (params.get('preflight')) {
    return json(
      {
        count: plan.length,
        bytes: plan.reduce((sum, p) => sum + (p.file.size ?? 0), 0),
        filename,
      },
      200
    )
  }

  let cancelled = false
  const stream = new ReadableStream<Uint8Array>(
    {
      async start(controller) {
        const zip = new Zip((error, chunk, final) => {
          if (error) {
            controller.error(error)
            return
          }
          controller.enqueue(chunk)
          if (final) controller.close()
        })

        const failures: string[] = []
        try {
          // Audio is already compressed, so store it as is
          for (const { path, file } of plan) {
            if (cancelled) return
            // Wait for the browser to take what is queued before fetching more
            while (!cancelled && (controller.desiredSize ?? 1) <= 0) {
              await sleep(25)
            }
            try {
              const data = new Uint8Array(
                await storage.getFileDownload(bucketId(), file.fileId)
              )
              const entry = new ZipPassThrough(path)
              if (file.uploadedAt) entry.mtime = new Date(file.uploadedAt)
              zip.add(entry)
              entry.push(data, true)
            } catch (error) {
              console.error(`Export: could not read ${path}:`, error)
              failures.push(
                `${path}: ${error instanceof Error ? error.message : String(error)}`
              )
            }
          }

          const text = new TextEncoder()
          const manifest = new ZipDeflate('manifest.csv')
          zip.add(manifest)
          manifest.push(text.encode(manifestCsv(plan)), true)

          // Any file that could not be read is listed rather than silently missing
          if (failures.length > 0) {
            const problems = new ZipDeflate('problems.txt')
            zip.add(problems)
            problems.push(
              text.encode(
                `These files could not be added to the zip. Download again to retry.\r\n\r\n${failures.join('\r\n')}\r\n`
              ),
              true
            )
          }
          zip.end()
        } catch (error) {
          console.error('Export: zip failed:', error)
          controller.error(error)
        }
      },
      cancel() {
        cancelled = true
      },
    },
    new ByteLengthQueuingStrategy({ highWaterMark: 16 * 1024 * 1024 })
  )

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
