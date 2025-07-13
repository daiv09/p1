"use client"
import React, { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Users, Star, ExternalLink, Filter, SortAsc, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

// Real-time package fetching functions
const fetchMakeMyTripPackages = async (destination) => {
  try {
    // In a real implementation, you'd use a backend API that scrapes MakeMyTrip
    const response = await fetch(`/api/scrape/makemytrip?destination=${encodeURIComponent(destination)}`)
    if (!response.ok) throw new Error('Failed to fetch MakeMyTrip packages')
    return await response.json()
  } catch (error) {
    console.error('MakeMyTrip fetch error:', error)
    return []
  }
}

const fetchYatraPackages = async (destination) => {
  try {
    const response = await fetch(`/api/scrape/yatra?destination=${encodeURIComponent(destination)}`)
    if (!response.ok) throw new Error('Failed to fetch Yatra packages')
    return await response.json()
  } catch (error) {
    console.error('Yatra fetch error:', error)
    return []
  }
}

const fetchGibiboPackages = async (destination) => {
  try {
    const response = await fetch(`/api/scrape/goibibo?destination=${encodeURIComponent(destination)}`)
    if (!response.ok) throw new Error('Failed to fetch Goibibo packages')
    return await response.json()
  } catch (error) {
    console.error('Goibibo fetch error:', error)
    return []
  }
}

const fetchBookingComPackages = async (destination) => {
  try {
    const response = await fetch(`/api/scrape/booking?destination=${encodeURIComponent(destination)}`)
    if (!response.ok) throw new Error('Failed to fetch Booking.com packages')
    return await response.json()
  } catch (error) {
    console.error('Booking.com fetch error:', error)
    return []
  }
}

const fetchTripAdvisorPackages = async (destination) => {
  try {
    const response = await fetch(`/api/scrape/tripadvisor?destination=${encodeURIComponent(destination)}`)
    if (!response.ok) throw new Error('Failed to fetch TripAdvisor packages')
    return await response.json()
  } catch (error) {
    console.error('TripAdvisor fetch error:', error)
    return []
  }
}

// Alternative: Use travel APIs
const fetchAmadeusPackages = async (destination) => {
  try {
    const response = await fetch(`/api/amadeus/packages?destination=${encodeURIComponent(destination)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_AMADEUS_API_KEY}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch Amadeus packages')
    return await response.json()
  } catch (error) {
    console.error('Amadeus fetch error:', error)
    return []
  }
}

export default function TravelPackageComparison() {
  const [currentView, setCurrentView] = useState('search')
  const [searchLocation, setSearchLocation] = useState('')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('price')
  const [filterRating, setFilterRating] = useState(0)
  const [fetchProgress, setFetchProgress] = useState({})

  // Real-time package fetching
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
    let completedSources = 0

    try {
      // Fetch from all sources concurrently
      const fetchPromises = sources.map(async (source) => {
        setFetchProgress(prev => ({ ...prev, [source.name]: 'loading' }))
        
        try {
          const packages = await source.fetcher(destination)
          setFetchProgress(prev => ({ ...prev, [source.name]: 'success' }))
          return packages.map(pkg => ({ ...pkg, source: source.name }))
        } catch (error) {
          setFetchProgress(prev => ({ ...prev, [source.name]: 'error' }))
          console.error(`Error fetching from ${source.name}:`, error)
          return []
        } finally {
          completedSources++
          // Update packages as each source completes
          setPackages(current => [...current, ...allPackages])
        }
      })

      const results = await Promise.allSettled(fetchPromises)
      
      // Combine all successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPackages.push(...result.value)
        }
      })

      // Remove duplicates and sort
      const uniquePackages = removeDuplicatePackages(allPackages)
      setPackages(uniquePackages)

      if (uniquePackages.length === 0) {
        setError('No packages found for this destination. Please try a different location.')
      }

    } catch (error) {
      console.error('Error fetching packages:', error)
      setError('Failed to fetch packages. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Remove duplicate packages based on title and price similarity
  const removeDuplicatePackages = (packages) => {
    const unique = []
    const seen = new Set()

    packages.forEach(pkg => {
      const key = `${pkg.title?.toLowerCase()}-${Math.round(pkg.price / 1000)}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(pkg)
      }
    })

    return unique
  }

  // Handle search
  const handleSearch = (location) => {
    if (!location.trim()) {
      setError('Please enter a destination')
      return
    }
    
    setSearchLocation(location)
    setCurrentView('results')
    fetchRealTimePackages(location)
  }

  // Refresh packages
  const refreshPackages = () => {
    if (searchLocation) {
      fetchRealTimePackages(searchLocation)
    }
  }

  // Sort and filter packages
  const sortedAndFilteredPackages = packages
    .filter(pkg => (pkg.rating || 0) >= filterRating)
    .sort((a, b) => {
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'duration') return (a.duration || '').localeCompare(b.duration || '')
      return 0
    })

  const SearchView = () => (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 px-6 py-12 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 drop-shadow-md mb-4">
        Compare Live Travel Packages
      </h1>
      
      <p className="text-lg text-gray-600 max-w-xl mb-2">
        Real-time comparison from top travel booking sites
      </p>
      
      <p className="text-sm text-gray-500 max-w-lg mb-10">
        We fetch live data from MakeMyTrip, Yatra, Goibibo, Booking.com, TripAdvisor & more
      </p>

      <div className="w-full max-w-md mb-16">
        <div className="relative">
          <input
            type="text"
            placeholder="Enter destination (e.g. Goa, Manali, Kerala...)"
            className="w-full px-5 py-3 pl-12 rounded-xl border border-gray-300 shadow-md bg-white/80 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchLocation)}
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        
        <button
          onClick={() => handleSearch(searchLocation)}
          disabled={loading}
          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl shadow-md transition transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl w-full px-4">
        {[
          { title: 'Goa Beach Paradise', desc: 'Live prices from 6+ booking sites', location: 'Goa' },
          { title: 'Manali Adventure', desc: 'Real-time availability & pricing', location: 'Manali' },
          { title: 'Kerala Backwaters', desc: 'Compare all major travel agencies', location: 'Kerala' },
        ].map((plan, idx) => (
          <div
            key={idx}
            onClick={() => handleSearch(plan.location)}
            className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
          >
            <h3 className="text-xl font-bold text-gray-800">{plan.title}</h3>
            <p className="text-gray-600 mt-2">{plan.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )

  const ResultsView = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('search')}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                ← Back to Search
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Live Packages for {searchLocation}
              </h1>
              <button
                onClick={refreshPackages}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-400"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="price">Sort by Price</option>
                <option value="rating">Sort by Rating</option>
                <option value="duration">Sort by Duration</option>
              </select>
              
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="0">All Ratings</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fetch Progress */}
      {loading && (
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              <span className="text-gray-700 font-medium">Fetching live packages...</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {Object.entries(fetchProgress).map(([source, status]) => (
                <div key={source} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                    status === 'success' ? 'bg-green-500' :
                    status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-xs text-gray-600">{source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {!loading && !error && sortedAndFilteredPackages.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600">Try searching for a different destination or check back later</p>
          </div>
        )}

        {sortedAndFilteredPackages.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Found {sortedAndFilteredPackages.length} live packages from {new Set(packages.map(p => p.source)).size} sources
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAndFilteredPackages.map((pkg, index) => (
                <div
                  key={`${pkg.source}-${index}`}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative">
                    {pkg.image && (
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 text-sm font-medium">
                      {pkg.source}
                    </div>
                    {pkg.discount && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white rounded-full px-3 py-1 text-sm font-medium">
                        {pkg.discount}% OFF
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      {pkg.duration && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">{pkg.duration}</span>
                        </div>
                      )}
                      {pkg.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-600">{pkg.rating} {pkg.reviews && `(${pkg.reviews})`}</span>
                        </div>
                      )}
                    </div>
                    
                    {pkg.highlights && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pkg.highlights.slice(0, 3).map((highlight, idx) => (
                          <span
                            key={idx}
                            className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-orange-600">
                            ₹{pkg.price?.toLocaleString() || 'N/A'}
                          </span>
                          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{pkg.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                      
                      <button 
                        onClick={() => pkg.bookingUrl && window.open(pkg.bookingUrl, '_blank')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>Book Now</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return currentView === 'search' ? <SearchView /> : <ResultsView />
}