'use server'

import { requireAdmin } from '@/lib/auth/guards'
import {
  checkAppwriteInitialization as checkCore,
  initializeAppwrite as initializeCore,
} from '@/lib/appwrite/initialization-core'
import type {
  InitializationResult,
  InitializationStatus,
} from '@/lib/appwrite/setup-types'

/**
 * What the Setup screen calls. The status lists the Appwrite endpoint, project
 * and database IDs, so it is for admins only.
 */
export async function checkAppwriteInitialization(): Promise<InitializationStatus> {
  await requireAdmin()
  return checkCore()
}

/** Create any missing Appwrite resources. Admins only. */
export async function initializeAppwrite(): Promise<InitializationResult> {
  await requireAdmin()
  return initializeCore()
}
