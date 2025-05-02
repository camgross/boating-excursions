import React from 'react'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Boating Excursions',
  description: 'Book your perfect boating adventure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
} 