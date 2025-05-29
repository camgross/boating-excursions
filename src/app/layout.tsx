import React from 'react'
import type { Metadata } from 'next'
import '@/styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import AuthStatus from '@/components/AuthStatus'
import AuthWidget from '@/components/AuthWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Boating Excursions',
  description: 'Book your next boating adventure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 8 }}>
          <AuthStatus />
          <AuthWidget />
        </div>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  )
} 