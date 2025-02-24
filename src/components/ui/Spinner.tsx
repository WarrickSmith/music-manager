'use client'

import React from 'react'

interface SpinnerProps {
  message: string
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center p-8 rounded-2xl">
        <div className="w-16 h-16 border-4 border-t-4 border-t-primary border-gray-200 rounded-full animate-spin" />
        <p className="mt-4 text-white text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}

export default Spinner
