"use client"

import { useState } from "react"
import { LeafletMap } from "@/components/leaflet-map"
import { ResultsPanel } from "@/components/results-panel"
import { Header } from "@/components/header"
import { LoadingOverlay } from "@/components/loading-overlay"
import { ErrorAlert } from "@/components/error-alert"
import type { TrainingCenter, AreaBounds } from "@/types"

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<AreaBounds | null>(null)
  const [trainingCenters, setTrainingCenters] = useState<TrainingCenter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapZoom, setMapZoom] = useState<number | null>(null)

  const handleAreaSelect = async (bounds: AreaBounds) => {
    setSelectedArea(bounds)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/scrape-training-centers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bounds }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch training centers")
      }

      const data = await response.json()

      if (data.success && data.centers) {
        setTrainingCenters(data.centers)
      } else {
        throw new Error(data.error || "Failed to retrieve training centers")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setTrainingCenters([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    if (trainingCenters.length === 0) return

    try {
      const response = await fetch("/api/export-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ centers: trainingCenters, format }),
      })

      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `training-centers.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data")
    }
  }

  const handleLocationSearch = (location: { lat: number; lng: number; name: string }) => {
    setMapCenter({ lat: location.lat, lng: location.lng })
    setMapZoom(13) // Zoom level for searched location
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLocationSearch={handleLocationSearch} />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <div className="flex-1 relative">
          <LeafletMap
            onAreaSelect={handleAreaSelect}
            selectedArea={selectedArea}
            trainingCenters={trainingCenters}
            center={mapCenter}
            zoom={mapZoom}
          />
          {isLoading && <LoadingOverlay />}
        </div>

        <div className="w-full lg:w-96 border-l border-gray-200 bg-white">
          <ResultsPanel trainingCenters={trainingCenters} onExport={handleExport} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
