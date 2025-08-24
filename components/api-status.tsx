"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from "lucide-react"

interface ApiStatusProps {
  isVisible: boolean
  onClose: () => void
}

export function ApiStatus({ isVisible, onClose }: ApiStatusProps) {
  const [status, setStatus] = useState<"checking" | "healthy" | "error">("checking")
  const [message, setMessage] = useState("Checking data extraction capabilities...")
  const [details, setDetails] = useState<any>(null)

  const checkApiHealth = async () => {
    try {
      setStatus("checking")
      setMessage("Checking data extraction capabilities...")

      const response = await fetch("/api/check-gemini-health")
      const data = await response.json()

      if (response.ok && data.status === "healthy") {
        setStatus("healthy")
        setMessage("Real data extraction system is operational")
        setDetails(data)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to verify data extraction system")
        setDetails(data)
      }
    } catch (error) {
      setStatus("error")
      setMessage("Network error checking system status")
      setDetails(null)
    }
  }

  useEffect(() => {
    if (isVisible) {
      checkApiHealth()
    }
  }, [isVisible])

  if (!isVisible) return null

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "checking":
        return "secondary"
      case "healthy":
        return "default"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Data Extraction Status
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium">Real Data Extraction System</span>
              <Badge variant={getStatusColor()}>{status}</Badge>
            </div>

            <p className="text-sm text-gray-600">{message}</p>

            {details && details.modelInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">AI Analysis Engine</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Model:</strong> {details.modelInfo.displayName}
                  </p>
                  <p>
                    <strong>Purpose:</strong> Content analysis and data extraction
                  </p>
                  <p>
                    <strong>Function:</strong> Extract real facility information from web sources
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-2">Real Data Extraction Process</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Web search for training centers in selected area</li>
                <li>• OpenStreetMap educational facility queries</li>
                <li>• AI-powered content analysis and extraction</li>
                <li>• Validation of real, existing facilities only</li>
                <li>• No fictional or generated data</li>
              </ul>
            </div>

            <div className="flex space-x-2">
              <Button onClick={checkApiHealth} size="sm" variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Status
              </Button>
              <a
                href="https://ai.google.dev/docs/gemini_api_overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button size="sm" variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Documentation
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
