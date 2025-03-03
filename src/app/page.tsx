import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex items-center gap-3 mb-6">
        <Image
          src="/mm-logo.png"
          alt="Music Manager Logo"
          width={48}
          height={48}
        />
        <h1 className="text-4xl font-bold">Music Manager</h1>
      </div>
      <p className="text-xl text-center mb-8 max-w-2xl">
        A platform for Ice Skaters to upload and manage music files for
        competitions
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </main>
  )
}
