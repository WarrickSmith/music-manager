/**
 * Build a plain-text error report that a user can paste into an email or
 * message to the person who runs the site. It carries no passwords or
 * file contents, only what happened and where.
 */
export function buildErrorReport(input: {
  title: string
  message: string
  details?: string
}): string {
  const lines = [
    'Music Manager error report',
    `Time: ${new Date().toISOString()}`,
    `Page: ${typeof window !== 'undefined' ? window.location.href : 'unknown'}`,
    `What happened: ${input.title}`,
    `Message: ${input.message}`,
  ]
  if (input.details) lines.push('', 'Details:', input.details)
  if (typeof navigator !== 'undefined') {
    lines.push('', `Browser: ${navigator.userAgent}`)
  }
  return lines.join('\n')
}

/** Copy text, falling back to a hidden textarea where the Clipboard API is unavailable */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}
