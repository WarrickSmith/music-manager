'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FaUser, FaSignOutAlt, FaMusic } from 'react-icons/fa'
import { useState } from 'react'

export default function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  return (
    <nav className="w-full py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 sticky top-0 z-50 shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:scale-105"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <Image
              src="/mm-logo.png"
              alt="Music Manager Logo"
              width={36}
              height={36}
              className="rounded-md relative"
            />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Music Manager
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FaMusic className="w-4 h-4" />
            <span>My Music</span>
          </Link>

          <div className="relative">
            <button
              onClick={toggleUserMenu}
              className="p-2.5 rounded-full bg-white hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center border border-blue-100 shadow-sm hover:shadow-md"
            >
              <FaUser className="w-5 h-5 text-gradient-to-r from-blue-600 to-purple-600" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-blue-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-blue-50">
                  <p className="text-sm font-medium text-gray-700">User Name</p>
                  <p className="text-xs text-gray-500 truncate">
                    user@example.com
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  <FaUser className="w-4 h-4 text-blue-500" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/logout"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
