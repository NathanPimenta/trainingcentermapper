"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Copy } from "lucide-react"

interface DebugPanelProps {
  isVisible: boolean
  onClose: () => void
}

export function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug-system")
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      setDiagnostics({
        error: "Failed to run diagnostics",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testGeminiKey = async () => {
    try {
      const response = await fetch("/api/test-gemini")
      const data = await response.json()

      if (data.success) {
        alert("✅ Gemini API key is working correctly!")
      } else {
        alert(`❌ API Key Test Failed:\n${data.error}\n\nDetails: ${data.details || "Check console for more info"}`)
        console.error("Gemini API test failed:", data)
      }
    } catch (error) {
      alert(`❌ Network Error:\n${error}`)
      console.error("Network error testing Gemini API:", error)
    }
  }

  useEffect(() => {
    if (isVisible) {
      runDiagnostics()
    }
  }, [isVisible])

  const copyToClipboard = () => {
    if (diagnostics) {
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
    }
  }

  if (!isVisible) return null

  const getTestIcon = (status: string) => {
    switch (status) {
      case "PASSED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTestBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return <Badge className="bg-green-100 text-green-800">PASSED</Badge>
      case "FAILED":
        return <Badge variant="destructive">FAILED</Badge>
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Diagnostics
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p>Running system diagnostics...</p>
            </div>
          ) : diagnostics ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {diagnostics.overallStatus === "HEALTHY" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    System Status: {diagnostics.overallStatus === "HEALTHY" ? "Healthy" : "Issues Detected"}
                  </span>
                </div>
                <Badge variant={diagnostics.overallStatus === "HEALTHY" ? "default" : "destructive"}>
                  {diagnostics.failedTestCount}/{diagnostics.totalTestCount} Tests Passed
                </Badge>
              </div>

              {/* Environment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="font-medium text-blue-800 mb-2">Environment Configuration</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Node Environment:</strong> {diagnostics.environment.nodeEnv}
                  </p>
                  <p>
                    <strong>Gemini API Key:</strong>{" "}
                    {diagnostics.environment.hasGeminiKey ? (
                      <span className="text-green-600">
                        ✓ Configured ({diagnostics.environment.geminiKeyLength} chars)
                      </span>
                    ) : (
                      <span className="text-red-600">✗ Not configured</span>
                    )}
                  </p>
                  {diagnostics.environment.hasGeminiKey && (
                    <p>
                      <strong>Key Preview:</strong> {diagnostics.environment.geminiKeyPrefix}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-3">
                <h3 className="font-medium">Test Results</h3>
                {Object.entries(diagnostics.tests).map(([testName, result]: [string, any]) => (
                  <div key={testName} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getTestIcon(result.status)}
                        <span className="font-medium capitalize">{testName.replace(/([A-Z])/g, " $1")}</span>
                      </div>
                      {getTestBadge(result.status)}
                    </div>

                    {result.message && <p className="text-sm text-gray-600 mb-1">{result.message}</p>}

                    {result.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <p className="text-sm text-red-800 font-medium">Error: {result.error}</p>
                        {result.details && <p className="text-xs text-red-600 mt-1">{result.details}</p>}
                        {result.solution && (
                          <p className="text-xs text-red-700 mt-2">
                            <strong>Solution:</strong> {result.solution}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Fixes */}
              {diagnostics.overallStatus !== "HEALTHY" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h3 className="font-medium text-yellow-800 mb-2">Quick Fixes</h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    {!diagnostics.environment.hasGeminiKey && (
                      <div>
                        <p className="font-medium">1. Set up Gemini API Key:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Visit: https://ai.google.dev/</li>
                          <li>Click "Get API key in Google AI Studio"</li>
                          <li>Create a new API key (free)</li>
                          <li>Add GEMINI_API_KEY=your_key to .env.local</li>
                          <li>Restart your application</li>
                        </ul>
                      </div>
                    )}
                    {diagnostics.tests.geminiConnectivity?.status === "FAILED" && (
                      <div>
                        <p className="font-medium">2. Fix Gemini API Connection:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Verify your API key is correct (no extra spaces)</li>
                          <li>Check if the key has proper permissions</li>
                          <li>Ensure you haven't exceeded rate limits</li>
                          <li>Try generating a new API key</li>
                        </ul>
                      </div>
                    )}
                    {(diagnostics.tests.nominatim?.status === "FAILED" ||
                      diagnostics.tests.duckduckgo?.status === "FAILED" ||
                      diagnostics.tests.overpass?.status === "FAILED") && (
                      <div>
                        <p className="font-medium">3. Network Connectivity:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Check your internet connection</li>
                          <li>Verify firewall settings allow external API calls</li>
                          <li>Some APIs may be temporarily unavailable</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button onClick={runDiagnostics} size="sm" variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-run Diagnostics
                </Button>
                <Button onClick={testGeminiKey} size="sm" variant="outline" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Test API Key
                </Button>
                <Button onClick={copyToClipboard} size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p>Failed to load diagnostics</p>
              <Button onClick={runDiagnostics} size="sm" className="mt-4">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
