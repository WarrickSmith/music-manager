'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FaUser } from 'react-icons/fa'

export default function Navbar() {
  return (
    <nav className="w-full py-3 px-4 border-b bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/mm-logo.png"
            alt="Music Manager Logo"
            width={32}
            height={32}
          />
          <h1 className="text-xl font-bold">Music Manager</h1>
        </Link>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-muted">
            <FaUser className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
