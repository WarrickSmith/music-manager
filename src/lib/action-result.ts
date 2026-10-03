/**
 * Result shape for server actions that can fail for reasons the user should
 * read, such as a closed deadline or a missing admin role. Next.js hides the
 * message of an error thrown from a server action in production, so these
 * return the message instead of throwing it.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function ok(): ActionResult<undefined>
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data }
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
