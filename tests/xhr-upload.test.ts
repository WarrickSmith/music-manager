import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  UploadError,
  uploadWithProgress,
  type UploadProgress,
} from '@/lib/upload/xhr-upload'

/** Minimal XMLHttpRequest stand-in that lets a test drive each event */
class FakeXHR {
  static last: FakeXHR
  upload: Record<string, ((e: unknown) => void) | null> = {
    onprogress: null,
    onload: null,
  }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeout: (() => void) | null = null
  onabort: (() => void) | null = null
  status = 0
  statusText = ''
  responseText = ''
  responseType = ''
  sent: FormData | null = null
  constructor() {
    FakeXHR.last = this
  }
  open = vi.fn()
  send(body: FormData) {
    this.sent = body
  }
  abort() {
    this.onabort?.()
  }
}

vi.stubGlobal('XMLHttpRequest', FakeXHR)
afterEach(() => vi.useRealTimers())

describe('uploadWithProgress', () => {
  it('reports byte progress, then processing, then the result', async () => {
    vi.useFakeTimers()
    const progress: UploadProgress[] = []
    const onProcessing = vi.fn()
    const promise = uploadWithProgress('/api/x', new FormData(), {
      onProgress: (p) => progress.push(p),
      onProcessing,
    })
    const xhr = FakeXHR.last

    vi.advanceTimersByTime(1000)
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 1000,
      total: 4000,
    })
    vi.advanceTimersByTime(1000)
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 4000,
      total: 4000,
    })
    xhr.upload.onload?.({})

    xhr.status = 200
    xhr.responseText = JSON.stringify({ success: true, musicFile: { id: '1' } })
    xhr.onload?.()

    await expect(promise).resolves.toMatchObject({ success: true })
    expect(progress.map((p) => p.loaded)).toEqual([1000, 4000])
    expect(progress[0].total).toBe(4000)
    expect(progress[1].bytesPerSecond).toBeGreaterThan(0)
    expect(onProcessing).toHaveBeenCalledOnce()
  })

  it('rejects with the server message when the response is an error', async () => {
    const promise = uploadWithProgress('/api/x', new FormData())
    const xhr = FakeXHR.last
    xhr.status = 400
    xhr.statusText = 'Bad Request'
    xhr.responseText = JSON.stringify({
      success: false,
      error: 'Invalid file type.',
    })
    xhr.onload?.()

    const error = (await promise.catch((e) => e)) as UploadError
    expect(error).toBeInstanceOf(UploadError)
    expect(error.message).toBe('Invalid file type.')
    expect(error.details).toContain('HTTP 400')
    expect(error.status).toBe(400)
  })

  it('passes the error code and extra data through, e.g. an existing file', async () => {
    const promise = uploadWithProgress('/api/x', new FormData())
    const xhr = FakeXHR.last
    xhr.status = 409
    xhr.responseText = JSON.stringify({
      success: false,
      code: 'exists',
      error: 'You already have a file for this programme.',
      existing: { id: 'abc', originalName: 'swan.mp3' },
    })
    xhr.onload?.()

    const error = (await promise.catch((e) => e)) as UploadError
    expect(error.code).toBe('exists')
    expect(error.status).toBe(409)
    expect(error.payload?.existing).toEqual({ id: 'abc', originalName: 'swan.mp3' })
  })

  it('explains an oversized upload when the server returns 413', async () => {
    const promise = uploadWithProgress('/api/x', new FormData())
    const xhr = FakeXHR.last
    xhr.status = 413
    xhr.responseText = '<html>too big</html>'
    xhr.onload?.()

    await expect(promise).rejects.toThrow('too large')
  })

  it('rejects with a connection message on a network error', async () => {
    const promise = uploadWithProgress('/api/x', new FormData())
    FakeXHR.last.onerror?.()
    await expect(promise).rejects.toThrow('could not reach the server')
  })

  it('aborts the request when the signal fires', async () => {
    const controller = new AbortController()
    const promise = uploadWithProgress('/api/x', new FormData(), {
      signal: controller.signal,
    })
    controller.abort()
    await expect(promise).rejects.toThrow('cancelled')
  })
})
