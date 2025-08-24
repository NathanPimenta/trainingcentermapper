"use client"

import { useState } from "react"
import { MapPin, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ApiStatus } from "@/components/api-status"
import { SearchBar } from "@/components/search-bar"
import { DebugPanel } from "@/components/debug-panel"

interface HeaderProps {
  onLocationSearch: (location: { lat: number; lng: number; name: string }) => void
}

export function Header({ onLocationSearch }: HeaderProps) {
  const [showStatus, setShowStatus] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-7xl mx-auto gap-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Training Center Mapper</h1>
            <Badge variant="outline" className="text-xs">
              Real Data Extraction
            </Badge>
          </div>

          <div className="flex-1 max-w-md">
            <SearchBar onSearch={onLocationSearch} />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowDebug(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Debug</span>
            </Button>
            <Button
              onClick={() => setShowStatus(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">API Status</span>
            </Button>
          </div>
        </div>
      </header>

      <ApiStatus isVisible={showStatus} onClose={() => setShowStatus(false)} />
      <DebugPanel isVisible={showDebug} onClose={() => setShowDebug(false)} />
    </>
  )
}
