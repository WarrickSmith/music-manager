'use client'

import Image from 'next/image'
import AuthForm from '@/components/auth/AuthForm'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-md mx-auto space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/globe.svg"
            alt="Music Manager Icon"
            width={32}
            height={32}
            className="dark:invert"
          />
          <h1 className="text-2xl font-bold">Music Manager</h1>
        </div>

        <AuthForm />
      </main>
    </div>
  )
}
