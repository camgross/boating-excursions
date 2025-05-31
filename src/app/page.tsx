'use client';
import React from 'react'
import AvailableExcursions from '@/components/excursions/AvailableExcursions'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Boating Excursions
        </h1>
        <p className="text-xl text-center mb-12 text-gray-600">
          Book your perfect boating adventure for an unforgettable vacation experience
        </p>
        
        <AvailableExcursions />
      </div>
    </div>
  )
} 