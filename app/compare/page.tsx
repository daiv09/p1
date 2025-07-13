// File: app/compare/page.tsx

"use client"

import React, { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function TravelPage() {
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState([])

  const handleSearch = async () => {
    if (!destination.trim()) return

    setLoading(true)
    setPackages([])

    try {
      const res = await fetch(`/api/search?query=${destination}`)
      const data = await res.json()
      setPackages(data)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 py-12 px-4 flex flex-col items-center">
      <motion.h1
        className="text-4xl font-bold text-gray-800 mb-4 text-center"
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        Compare Live Tour Packages
      </motion.h1>

      <motion.div
        className="w-full max-w-xl relative"
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        <Search className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination (e.g. Goa)"
          className="pl-10 w-full py-3 rounded-xl shadow-md border border-gray-200 focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Loading...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </motion.div>

      <div className="mt-12 w-full max-w-6xl grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {packages.map((pkg, i) => (
            <motion.div
              key={i}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-1">{pkg.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{pkg.duration} · ₹{pkg.price}</p>
              <p className="text-xs text-gray-500 mb-4">{pkg.description}</p>
              <a
                href={pkg.url}
                target="_blank"
                className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                Book Now
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  )
}
