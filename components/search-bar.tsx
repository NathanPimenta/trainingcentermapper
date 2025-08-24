"use client"

import type React from "react"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (location: { lat: number; lng: number; name: string }) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])

    try {
      // Use Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      )

      if (!response.ok) {
        throw new Error("Failed to search location")
      }

      const data = await response.json()
      setSearchResults(data)

      if (data.length === 0) {
        setError("No results found. Try a different search term.")
      }
    } catch (err) {
      setError("Error searching for location. Please try again.")
      console.error("Search error:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = (result: any) => {
    onSearch({
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
      name: result.display_name,
    })
    setSearchResults([])
    setQuery("")
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search for a location..."
            className="pl-9 pr-4 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="ml-2" disabled={isSearching || !query.trim()}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-0"
              onClick={() => handleSelectLocation(result)}
            >
              <div className="font-medium text-sm">{result.display_name.split(",")[0]}</div>
              <div className="text-xs text-gray-500 truncate">{result.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
