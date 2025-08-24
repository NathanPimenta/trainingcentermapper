"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import type { TrainingCenter, AreaBounds } from "@/types"

interface MapContainerProps {
  onAreaSelect: (bounds: AreaBounds) => void
  selectedArea: AreaBounds | null
  trainingCenters: TrainingCenter[]
}

export function MapContainer({ onAreaSelect, selectedArea, trainingCenters }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !map) {
      // Initialize map (using a simple implementation for demo)
      const mapInstance = {
        container: mapRef.current,
        center: { lat: 40.7128, lng: -74.006 }, // NYC
        zoom: 10,
      }
      setMap(mapInstance)
    }
  }, [map])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsSelecting(true)
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setSelectionEnd(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return

    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return

    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return

    setIsSelecting(false)

    // Convert pixel coordinates to geographic bounds (simplified)
    const bounds: AreaBounds = {
      north: 40.8 - (Math.min(selectionStart.y, selectionEnd.y) / 500) * 0.2,
      south: 40.8 - (Math.max(selectionStart.y, selectionEnd.y) / 500) * 0.2,
      east: -73.9 + (Math.max(selectionStart.x, selectionEnd.x) / 500) * 0.2,
      west: -73.9 + (Math.min(selectionStart.x, selectionEnd.x) / 500) * 0.2,
    }

    onAreaSelect(bounds)
  }

  const resetSelection = () => {
    setSelectionStart(null)
    setSelectionEnd(null)
    setIsSelecting(false)
  }

  const getSelectionStyle = () => {
    if (!selectionStart || !selectionEnd) return {}

    const left = Math.min(selectionStart.x, selectionEnd.x)
    const top = Math.min(selectionStart.y, selectionEnd.y)
    const width = Math.abs(selectionEnd.x - selectionStart.x)
    const height = Math.abs(selectionEnd.y - selectionStart.y)

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    }
  }

  return (
    <div className="relative h-full">
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 cursor-crosshair relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsSelecting(false)}
      >
        {/* Simplified map background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-green-300 rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-yellow-300 rounded-full"></div>
        </div>

        {/* Selection rectangle */}
        {selectionStart && selectionEnd && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
            style={getSelectionStyle()}
          />
        )}

        {/* Training center markers */}
        {trainingCenters.map((center, index) => (
          <div
            key={center.id}
            className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              center.category === "blue-collar"
                ? "bg-blue-600"
                : center.category === "white-collar"
                  ? "bg-green-600"
                  : "bg-purple-600"
            }`}
            style={{
              left: `${30 + (index % 10) * 50}px`,
              top: `${100 + Math.floor(index / 10) * 60}px`,
            }}
            title={center.name}
          />
        ))}

        {/* Map instructions */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-700 font-medium">Click and drag to select an area</p>
          <p className="text-xs text-gray-500 mt-1">Release to search for training centers</p>
        </div>

        {/* Reset button */}
        {selectedArea && (
          <Button onClick={resetSelection} size="sm" variant="outline" className="absolute top-4 right-4 bg-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
