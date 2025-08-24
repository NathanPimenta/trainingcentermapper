"use client"

import { useState, useEffect } from "react"

export function LoadingOverlay() {
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState("Identifying location...")

  const tasks = [
    "Identifying location...",
    "Searching web for training centers...",
    "Gathering educational facility data...",
    "Querying OpenStreetMap database...",
    "Collecting real business information...",
    "Analyzing data with Gemini AI...",
    "Extracting training center details...",
    "Validating real facility information...",
    "Finalizing results...",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 10, 95)
        const taskIndex = Math.floor((newProgress / 100) * tasks.length)
        setCurrentTask(tasks[Math.min(taskIndex, tasks.length - 1)])
        return newProgress
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

        <p className="text-gray-700 font-medium mb-2">Real Data Extraction</p>
        <p className="text-sm text-gray-600 mb-4">{currentTask}</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Searching web for real training centers</p>
          <p>• Extracting data from OpenStreetMap</p>
          <p>• Using Gemini AI to analyze content</p>
          <p>• Validating real facility information</p>
          <p className="font-medium">Powered by Google Gemini AI</p>
        </div>

        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>Gemini-Powered Extraction:</strong>
            <br />✓ Web search results analysis
            <br />✓ OpenStreetMap facility data
            <br />✓ AI-powered content extraction
            <br />✓ Only real, existing facilities
          </p>
        </div>
      </div>
    </div>
  )
}
