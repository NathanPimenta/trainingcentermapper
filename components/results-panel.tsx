"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, MapPin, Phone, Mail, ExternalLink, AlertCircle, Database } from "lucide-react"
import type { TrainingCenter } from "@/types"

interface ResultsPanelProps {
  trainingCenters: TrainingCenter[]
  onExport: (format: "csv" | "json") => void
  isLoading: boolean
}

export function ResultsPanel({ trainingCenters, onExport, isLoading }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState("all")

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "blue-collar":
        return "bg-blue-100 text-blue-800"
      case "white-collar":
        return "bg-green-100 text-green-800"
      default:
        return "bg-purple-100 text-purple-800"
    }
  }

  const getSourceIcon = (description: string) => {
    if (description.includes("OSM")) return "🗺️"
    if (description.includes("DuckDuckGo") || description.includes("Search")) return "🔍"
    if (description.includes("Web")) return "🌐"
    return "📊"
  }

  const filteredCenters = trainingCenters.filter((center) => activeTab === "all" || center.category === activeTab)

  const categoryCounts = {
    "blue-collar": trainingCenters.filter((c) => c.category === "blue-collar").length,
    "white-collar": trainingCenters.filter((c) => c.category === "white-collar").length,
    other: trainingCenters.filter((c) => c.category === "other").length,
  }

  if (isLoading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Extracting Real Data</p>
          <p className="text-sm text-gray-500 mt-1">Analyzing web sources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Real Data Results ({trainingCenters.length})</h2>
          {trainingCenters.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              <Database className="h-3 w-3 inline mr-1" />
              Extracted from real web sources
            </p>
          )}
        </div>
        {trainingCenters.length > 0 && (
          <div className="flex space-x-2">
            <Button onClick={() => onExport("csv")} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button onClick={() => onExport("json")} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        )}
      </div>

      {trainingCenters.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No area selected</p>
            <p className="text-sm text-gray-500 mb-4">Select an area on the map to find training centers</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Real Data Extraction Process</p>
                  <p>This app extracts real training centers by:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Searching web sources for training facilities</li>
                    <li>Querying OpenStreetMap educational data</li>
                    <li>Using Gemini AI to analyze and extract info</li>
                    <li>Validating only real, existing facilities</li>
                  </ul>
                  <p className="mt-2 font-medium">No fictional data generated!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="blue-collar">Blue ({categoryCounts["blue-collar"]})</TabsTrigger>
              <TabsTrigger value="white-collar">White ({categoryCounts["white-collar"]})</TabsTrigger>
              <TabsTrigger value="other">Other ({categoryCounts.other})</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {filteredCenters.map((center) => (
                  <Card key={center.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-tight">{center.name}</CardTitle>
                        <Badge className={getCategoryColor(center.category)}>{center.category.replace("-", " ")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">{center.address}</span>
                        </div>

                        {center.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <a href={`tel:${center.phone}`} className="hover:text-blue-600">
                              {center.phone}
                            </a>
                          </div>
                        )}

                        {center.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <a href={`mailto:${center.email}`} className="truncate hover:text-blue-600">
                              {center.email}
                            </a>
                          </div>
                        )}

                        {center.website && (
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={center.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}

                        {center.description && (
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{center.description}</p>
                        )}

                        {/* Source indicator */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">{getSourceIcon(center.description || "")}</span>
                            <span className="text-xs text-gray-400">Real Data Source</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">● Extracted from Web</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  )
}
