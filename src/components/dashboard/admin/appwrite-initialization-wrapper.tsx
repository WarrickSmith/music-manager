'use client'

import dynamic from 'next/dynamic'

// Dynamically import the AppwriteInitialization component with no SSR
const AppwriteInitialization = dynamic(
  () => import('./appwrite-initialization'),
  { ssr: false }
)

export default function AppwriteInitializationWrapper() {
  return <AppwriteInitialization />
}