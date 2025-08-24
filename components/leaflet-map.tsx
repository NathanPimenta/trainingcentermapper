"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, ZoomIn, ZoomOut, Square } from "lucide-react"
import type { TrainingCenter, AreaBounds } from "@/types"

interface LeafletMapProps {
  onAreaSelect: (bounds: AreaBounds) => void
  selectedArea: AreaBounds | null
  trainingCenters: TrainingCenter[]
  center?: { lat: number; lng: number } | null
  zoom?: number | null
}

export function LeafletMap({ onAreaSelect, selectedArea, trainingCenters, center, zoom }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [L, setL] = useState<any>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRectangle, setSelectionRectangle] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        const leaflet = await import("leaflet")

        // Fix for default markers
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        setL(leaflet)
      }
    }
    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (L && mapRef.current && !map) {
      const mapInstance = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([40.7128, -74.006], 10)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      setMap(mapInstance)
    }
  }, [L, map])

  // Update map center and zoom when search is performed
  useEffect(() => {
    if (map && center) {
      map.setView([center.lat, center.lng], zoom || 13)

      // Add a temporary marker at the searched location
      const searchMarker = L.marker([center.lat, center.lng]).addTo(map)
      searchMarker.bindPopup("Searched location").openPopup()

      // Remove the marker after 5 seconds
      setTimeout(() => {
        if (map) {
          map.removeLayer(searchMarker)
        }
      }, 5000)
    }
  }, [map, center, zoom, L])

  // Handle area selection with custom rectangle drawing
  useEffect(() => {
    if (!map || !L || !isSelecting) return

    let isDrawing = false
    let startLatLng: any = null
    let currentRectangle: any = null

    // Disable map interactions during selection
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()

    const onMouseDown = (e: any) => {
      isDrawing = true
      startLatLng = e.latlng

      // Remove existing rectangle
      if (currentRectangle) {
        map.removeLayer(currentRectangle)
      }
      if (selectionRectangle) {
        map.removeLayer(selectionRectangle)
        setSelectionRectangle(null)
      }

      // Prevent event propagation
      L.DomEvent.stopPropagation(e.originalEvent)
      L.DomEvent.preventDefault(e.originalEvent)
    }

    const onMouseMove = (e: any) => {
      if (!isDrawing || !startLatLng) return

      // Remove previous rectangle
      if (currentRectangle) {
        map.removeLayer(currentRectangle)
      }

      // Create bounds and rectangle
      const bounds = L.latLngBounds(startLatLng, e.latlng)
      currentRectangle = L.rectangle(bounds, {
        color: "#3b82f6",
        weight: 2,
        fillOpacity: 0.2,
        fillColor: "#3b82f6",
        dashArray: "5, 5",
      }).addTo(map)
    }

    const onMouseUp = (e: any) => {
      if (!isDrawing || !startLatLng) return

      isDrawing = false

      // Create final bounds
      const bounds = L.latLngBounds(startLatLng, e.latlng)

      // Check if selection is large enough
      const minSize = 0.001
      const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth())
      const lngDiff = Math.abs(bounds.getEast() - bounds.getWest())

      if (latDiff > minSize && lngDiff > minSize) {
        // Create final rectangle
        if (currentRectangle) {
          map.removeLayer(currentRectangle)
        }

        const finalRectangle = L.rectangle(bounds, {
          color: "#2563eb",
          weight: 3,
          fillOpacity: 0.1,
          fillColor: "#2563eb",
        }).addTo(map)

        setSelectionRectangle(finalRectangle)

        // Create area bounds
        const areaBounds: AreaBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        }

        // Call the selection handler
        onAreaSelect(areaBounds)
        setIsSelecting(false)
      } else {
        // Remove small rectangles
        if (currentRectangle) {
          map.removeLayer(currentRectangle)
        }
      }

      // Reset
      startLatLng = null
      currentRectangle = null
    }

    // Add event listeners to the map container
    const mapContainer = map.getContainer()
    mapContainer.style.cursor = "crosshair"

    map.on("mousedown", onMouseDown)
    map.on("mousemove", onMouseMove)
    map.on("mouseup", onMouseUp)

    // Cleanup function
    return () => {
      map.off("mousedown", onMouseDown)
      map.off("mousemove", onMouseMove)
      map.off("mouseup", onMouseUp)

      // Re-enable map interactions
      map.dragging.enable()
      map.touchZoom.enable()
      map.doubleClickZoom.enable()
      map.scrollWheelZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()

      mapContainer.style.cursor = ""

      if (currentRectangle) {
        map.removeLayer(currentRectangle)
      }
    }
  }, [map, L, isSelecting, onAreaSelect, selectionRectangle])

  // Update markers when training centers change
  useEffect(() => {
    if (!map || !L) return

    // Clear existing markers
    markers.forEach((marker) => map.removeLayer(marker))
    setMarkers([])

    // Add new markers
    const newMarkers = trainingCenters.map((center) => {
      const iconColor =
        center.category === "blue-collar" ? "#2563eb" : center.category === "white-collar" ? "#16a34a" : "#9333ea"

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: "custom-marker",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      const marker = L.marker([center.coordinates.lat, center.coordinates.lng], {
        icon: customIcon,
      }).addTo(map)

      marker.bindPopup(`
        <div class="p-2 max-w-xs">
          <h3 class="font-semibold text-sm">${center.name}</h3>
          <p class="text-xs text-gray-600 mt-1 capitalize">${center.category.replace("-", " ")}</p>
          <p class="text-xs mt-1">${center.address}</p>
          ${center.phone ? `<p class="text-xs mt-1">📞 ${center.phone}</p>` : ""}
          ${center.website ? `<p class="text-xs mt-1"><a href="${center.website}" target="_blank" class="text-blue-600 hover:underline">Visit Website</a></p>` : ""}
        </div>
      `)

      return marker
    })

    setMarkers(newMarkers)

    // If we have markers, fit the map to show all of them
    if (newMarkers.length > 0 && selectionRectangle) {
      map.fitBounds(selectionRectangle.getBounds())
    }
  }, [map, L, trainingCenters, selectionRectangle])

  const toggleSelection = () => {
    setIsSelecting(!isSelecting)
  }

  const resetSelection = () => {
    setIsSelecting(false)
    if (selectionRectangle && map) {
      map.removeLayer(selectionRectangle)
      setSelectionRectangle(null)
    }
  }

  const zoomIn = () => map?.zoomIn()
  const zoomOut = () => map?.zoomOut()

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* Map controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-sm text-gray-700 font-medium mb-2">Map Controls</p>
        <div className="space-y-2">
          <Button
            onClick={toggleSelection}
            size="sm"
            variant={isSelecting ? "default" : "outline"}
            className="w-full text-xs"
          >
            <Square className="h-3 w-3 mr-1" />
            {isSelecting ? "Cancel Selection" : "Select Area"}
          </Button>
          {(selectedArea || selectionRectangle) && (
            <Button onClick={resetSelection} size="sm" variant="outline" className="w-full text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg z-[1000]">
        <Button onClick={zoomIn} size="sm" variant="ghost" className="rounded-b-none">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button onClick={zoomOut} size="sm" variant="ghost" className="rounded-t-none border-t">
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection instructions */}
      {isSelecting && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1000] animate-pulse">
          <p className="text-sm font-medium">Click and drag on the map to select an area</p>
        </div>
      )}

      {/* Legend */}
      {trainingCenters.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <p className="text-sm font-medium mb-2">Training Centers</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-xs">Blue-collar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-xs">White-collar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-xs">Other</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
