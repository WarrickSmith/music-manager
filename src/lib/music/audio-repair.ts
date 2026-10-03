import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Some MP3 files play in desktop players but are rejected by a browser's
 * stricter decoder part-way through (Edge and Chrome stop with a decode
 * error). ffmpeg can find these files by decoding them strictly, and can
 * re-encode them into a clean MP3.
 *
 * Both steps need the ffmpeg program. When it is not installed (for example on
 * a developer machine) the check reports the file as fine and the upload goes
 * ahead as before.
 */

/** A strict decode that reports this many problems or more counts as damaged */
export const PROBLEM_THRESHOLD = 5

const TIMEOUT_MS = 90_000
const MAX_CONCURRENT = 2

/** Thrown with a message that is safe to show to the person uploading */
export class RepairError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepairError'
  }
}

interface RunResult {
  code: number | null
  stderr: string
}

function run(args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-nostdin', '-hide_banner', ...args], {
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      // The strict decode can be very chatty; the count matters, not the text
      if (stderr.length < 2_000_000) stderr += chunk.toString('utf8')
    })
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS)
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stderr })
    })
  })
}

let available: Promise<boolean> | null = null

/** Whether the ffmpeg program can be run here; checked once */
export function ffmpegAvailable(): Promise<boolean> {
  available ??= run(['-version']).then(
    (result) => result.code === 0,
    () => false
  )
  return available
}

/** Test hook: forget the cached availability answer */
export function resetFfmpegAvailability() {
  available = null
}

// Only a few ffmpeg jobs at once, so a burst of uploads cannot starve the app
let running = 0
const waiting: (() => void)[] = []

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve))
  }
  running++
  try {
    return await task()
  } finally {
    running--
    waiting.shift()?.()
  }
}

async function withTempFile<T>(
  bytes: Uint8Array,
  task: (inputPath: string, dir: string) => Promise<T>
): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), 'mm-audio-'))
  try {
    const inputPath = path.join(dir, 'input')
    await writeFile(inputPath, bytes)
    return await task(inputPath, dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Count the problems in ffmpeg's output, ignoring harmless notes */
export function countProblems(stderr: string): number {
  return stderr
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/estimating duration/i.test(line)).length
}

export interface PlayableCheck {
  /** False when ffmpeg is missing, so nothing was checked */
  checked: boolean
  playable: boolean
  problems: number
}

/**
 * Decode the whole file strictly, the way a browser does, and count what goes
 * wrong. A healthy file reports none.
 */
export async function checkPlayable(bytes: Uint8Array): Promise<PlayableCheck> {
  if (!(await ffmpegAvailable())) {
    return { checked: false, playable: true, problems: 0 }
  }
  return withSlot(() =>
    withTempFile(bytes, async (inputPath) => {
      const { code, stderr } = await run([
        '-loglevel',
        'repeat+warning',
        '-err_detect',
        '+bitstream+buffer+careful',
        '-i',
        inputPath,
        '-vn',
        '-f',
        'null',
        '-',
      ])
      const problems = countProblems(stderr)
      return {
        checked: true,
        playable: code === 0 && problems < PROBLEM_THRESHOLD,
        problems,
      }
    })
  )
}

/**
 * Re-encode the audio into a clean MP3, keeping the title, artist and other
 * tags but dropping any cover picture. Quality 2 is variable bit rate at about
 * 190 kbps, which is not audibly different from a typical 192 kbps file.
 */
export async function repairToMp3(
  bytes: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  if (!(await ffmpegAvailable())) {
    throw new RepairError('This server cannot repair audio files.')
  }
  return withSlot(() =>
    withTempFile(bytes, async (inputPath, dir) => {
      const outputPath = path.join(dir, 'fixed.mp3')
      const { code } = await run([
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-vn',
        '-map_metadata',
        '0',
        '-c:a',
        'libmp3lame',
        '-q:a',
        '2',
        '-id3v2_version',
        '3',
        '-f',
        'mp3',
        outputPath,
      ])
      if (code !== 0) {
        throw new RepairError(
          'We could not repair this file. Please export it again from your music software as a new MP3 and upload that.'
        )
      }
      return new Uint8Array(await readFile(outputPath))
    })
  )
}
