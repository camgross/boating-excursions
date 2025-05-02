import React from 'react'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            Boating Excursions
          </Link>
          <div className="flex space-x-4">
            <Link href="/excursions" className="text-gray-600 hover:text-primary">
              Excursions
            </Link>
            <Link href="/booking" className="text-gray-600 hover:text-primary">
              Book Now
            </Link>
            <Link href="/suggestions" className="text-gray-600 hover:text-primary">
              Suggest
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 