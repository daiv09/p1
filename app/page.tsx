"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Search, MapPin, Calendar, Users, Star, ExternalLink, Filter, SortAsc, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import Fuse from 'fuse.js'
import debounce from 'lodash.debounce'

// Mock fetching simulation
const mockFetch = async (source, destination) => {
  await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000))
  if (Math.random() < 0.1) throw new Error(`${source} failed`)
  return [{
    title: `${destination} Tour by ${source}`,
    price: Math.floor(Math.random() * 20000) + 5000,
    originalPrice: Math.floor(Math.random() * 10000) + 20000,
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviews: Math.floor(Math.random() * 300),
    duration: `${Math.floor(Math.random() * 5) + 2} Days`,
    highlights: ['Hotel Stay', 'Sightseeing', 'Transfers'],
    discount: Math.floor(Math.random() * 30) + 10,
    bookingUrl: `https://${source.toLowerCase().replace(/\s/g, '')}.com/package/${destination}`,
    source,
    image: `https://source.unsplash.com/featured/?travel,${destination}`
  }]
}

const fetchMakeMyTripPackages = (d) => mockFetch('MakeMyTrip', d)
const fetchYatraPackages = (d) => mockFetch('Yatra', d)
const fetchGibiboPackages = (d) => mockFetch('Goibibo', d)
const fetchBookingComPackages = (d) => mockFetch('Booking.com', d)
const fetchTripAdvisorPackages = (d) => mockFetch('TripAdvisor', d)
const fetchAmadeusPackages = (d) => mockFetch('Amadeus', d)

export default function TravelPackageComparison() {
  const [currentView, setCurrentView] = useState('search')
  const [searchLocation, setSearchLocation] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('price')
  const [filterRating, setFilterRating] = useState(0)
  const [fetchProgress, setFetchProgress] = useState({})

  const cities = ['Goa', 'Manali', 'Kerala', 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Shimla', 'Jaipur', 'Leh', 'Udaipur']
  const fuse = useMemo(() => new Fuse(cities, { threshold: 0.3 }), [])

  // Debounced suggestion update
  const updateSuggestions = useMemo(() =>
    debounce((value) => {
      if (value.trim()) {
        const results = fuse.search(value).map(r => r.item)
        setSuggestions(results)
      } else {
        setSuggestions([])
      }
    }, 200), [fuse]
  )

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchLocation(value)
    updateSuggestions(value)
  }

  const handleSuggestionClick = (city) => {
    setSearchLocation(city)
    setSuggestions([])
    handleSearch(city)
  }

  const fetchRealTimePackages = async (destination) => {
    setLoading(true)
    setError(null)
    setPackages([])
    setFetchProgress({})

    const sources = [
      { name: 'MakeMyTrip', fetcher: fetchMakeMyTripPackages },
      { name: 'Yatra', fetcher: fetchYatraPackages },
      { name: 'Goibibo', fetcher: fetchGibiboPackages },
      { name: 'Booking.com', fetcher: fetchBookingComPackages },
      { name: 'TripAdvisor', fetcher: fetchTripAdvisorPackages },
      { name: 'Amadeus', fetcher: fetchAmadeusPackages }
    ]

    const allPackages = []

    try {
      const fetchPromises = sources.map(async (source) => {
        setFetchProgress(prev => ({ ...prev, [source.name]: 'loading' }))
        try {
          const data = await source.fetcher(destination)
          setFetchProgress(prev => ({ ...prev, [source.name]: 'success' }))
          return data.map(pkg => ({ ...pkg, source: source.name }))
        } catch (err) {
          setFetchProgress(prev => ({ ...prev, [source.name]: 'error' }))
          return []
        }
      })

      const results = await Promise.allSettled(fetchPromises)
      results.forEach((result) => {
        if (result.status === 'fulfilled') allPackages.push(...result.value)
      })

      const uniquePackages = removeDuplicatePackages(allPackages)
      setPackages(uniquePackages)

      if (uniquePackages.length === 0) {
        setError('No packages found for this destination. Please try a different location.')
      }
    } catch (err) {
      setError('Failed to fetch packages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const removeDuplicatePackages = (packages) => {
    const seen = new Set()
    return packages.filter(pkg => {
      const key = `${pkg.title?.toLowerCase()}-${Math.round(pkg.price / 1000)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const handleSearch = (location) => {
    if (!location.trim()) {
      setError('Please enter a destination')
      return
    }
    setError(null)
    setCurrentView('results')
    fetchRealTimePackages(location)
  }

  const refreshPackages = () => {
    if (searchLocation) fetchRealTimePackages(searchLocation)
  }

  const sortedAndFilteredPackages = packages
    .filter(pkg => (pkg.rating || 0) >= filterRating)
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'duration') return (a.duration || '').localeCompare(b.duration || '')
      return 0
    })

  // Views
  const SearchView = () => (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 px-6 py-12 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 drop-shadow-md mb-4">
        Compare Live Travel Packages
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-2">
        Real-time comparison from top travel booking sites
      </p>
      <div className="w-full max-w-md mb-16">
        <div className="relative">
  <input
    type="text"
    placeholder="Enter destination (e.g. Goa, Manali, Kerala...)"
    className="w-full px-5 py-3 pl-12 rounded-xl border border-gray-300 shadow-md bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-orange-500"
    value={searchLocation}
    onChange={handleInputChange}
    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchLocation)}
  />

  {suggestions.length > 0 && (
    <ul
      tabIndex={-1}
      className="absolute z-10 w-full bg-white shadow-lg rounded-xl mt-2 border border-gray-200"
    >
      {suggestions.map((city, idx) => (
        <li
          key={idx}
          // ✅ Use onMouseDown instead of onClick to prevent blur before execution
          onMouseDown={(e) => {
            e.preventDefault() // Prevent losing focus
            handleSuggestionClick(city)
          }}
          className="px-4 py-2 hover:bg-orange-100 cursor-pointer text-left text-gray-700"
        >
          {city}
        </li>
      ))}
    </ul>
  )}

  <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
</div>

        <button
          onClick={() => handleSearch(searchLocation)}
          disabled={loading}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl shadow-md transition transform hover:scale-105"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </span>
          ) : (
            'Search Live Packages'
          )}
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8 max-w-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
    </main>
  )

  const ResultsView = () => (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-orange-50 via-white to-blue-50">
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => setCurrentView('search')}
        className="text-orange-600 font-semibold hover:underline"
      >
        ← Back to Search
      </button>
      <button
        onClick={refreshPackages}
        className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex gap-4 items-center">
        <label className="font-medium">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-md px-3 py-1"
        >
          <option value="price">Price</option>
          <option value="rating">Rating</option>
          <option value="duration">Duration</option>
        </select>
      </div>
      <div className="flex gap-4 items-center">
        <label className="font-medium">Min Rating:</label>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(Number(e.target.value))}
          className="border rounded-md px-3 py-1"
        >
          <option value={0}>All</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
        </select>
      </div>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sortedAndFilteredPackages.map((pkg, idx) => (
        <div key={idx} className="bg-white shadow-md rounded-xl overflow-hidden">
          {/* <img
            src={pkg.image}
            alt={pkg.title}
            className="w-full h-48 object-cover"
          /> */}
          <div className="p-4">
            <h3 className="text-lg font-semibold">{pkg.title}</h3>
            <p className="text-sm text-gray-500 mb-2">{pkg.duration}</p>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{pkg.rating} ({pkg.reviews} reviews)</span>
            </div>
            <div className="mb-2">
              <span className="text-orange-600 font-bold text-lg">₹{pkg.price}</span>
              <span className="line-through text-gray-400 ml-2">₹{pkg.originalPrice}</span>
            </div>
            <ul className="text-sm text-gray-600 list-disc list-inside mb-2">
              {pkg.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <a
              href={pkg.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              Book Now <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className={`px-4 py-2 text-sm text-right text-white ${fetchProgress[pkg.source] === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {pkg.source}
          </div>
        </div>
      ))}
    </div>

    {sortedAndFilteredPackages.length === 0 && !loading && (
      <div className="text-center mt-12 text-gray-500">No packages match your filter.</div>
    )}
  </div>
  )

  return currentView === 'search' ? <SearchView /> : <ResultsView />
}
