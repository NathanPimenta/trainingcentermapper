import { NextResponse } from "next/server"

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + "..." || "Not set",
    },
    tests: {} as any,
  }

  // Test 1: Check if Gemini API key is configured
  if (!process.env.GEMINI_API_KEY) {
    diagnostics.tests.geminiConfig = {
      status: "FAILED",
      error: "GEMINI_API_KEY environment variable is not set",
      solution: "Add GEMINI_API_KEY to your environment variables",
    }
  } else {
    diagnostics.tests.geminiConfig = {
      status: "PASSED",
      message: "Gemini API key is configured",
    }
  }

  // Test 2: Test Gemini API connectivity
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        diagnostics.tests.geminiConnectivity = {
          status: "PASSED",
          message: "Gemini API is accessible and responding",
        }
      } else {
        const errorText = await response.text()
        diagnostics.tests.geminiConnectivity = {
          status: "FAILED",
          error: `Gemini API returned ${response.status}: ${response.statusText}`,
          details: errorText,
          solution: "Check if your API key is valid and has proper permissions",
        }
      }
    } catch (error) {
      diagnostics.tests.geminiConnectivity = {
        status: "FAILED",
        error: "Network error connecting to Gemini API",
        details: error instanceof Error ? error.message : "Unknown error",
        solution: "Check your internet connection and firewall settings",
      }
    }
  }

  // Test 3: Test external APIs
  try {
    const nominatimResponse = await fetch("https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1", {
      headers: {
        "User-Agent": "TrainingCenterMapper/1.0",
      },
    })

    if (nominatimResponse.ok) {
      diagnostics.tests.nominatim = {
        status: "PASSED",
        message: "Nominatim geocoding API is accessible",
      }
    } else {
      diagnostics.tests.nominatim = {
        status: "FAILED",
        error: `Nominatim API returned ${nominatimResponse.status}`,
      }
    }
  } catch (error) {
    diagnostics.tests.nominatim = {
      status: "FAILED",
      error: "Cannot reach Nominatim API",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Test 4: Test DuckDuckGo API
  try {
    const ddgResponse = await fetch("https://api.duckduckgo.com/?q=test&format=json&no_html=1&skip_disambig=1")

    if (ddgResponse.ok) {
      diagnostics.tests.duckduckgo = {
        status: "PASSED",
        message: "DuckDuckGo API is accessible",
      }
    } else {
      diagnostics.tests.duckduckgo = {
        status: "FAILED",
        error: `DuckDuckGo API returned ${ddgResponse.status}`,
      }
    }
  } catch (error) {
    diagnostics.tests.duckduckgo = {
      status: "FAILED",
      error: "Cannot reach DuckDuckGo API",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Test 5: Test Overpass API
  try {
    const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=[out:json][timeout:5];node(40.7,-74.1,40.8,-74.0)[amenity=school];out 1;",
    })

    if (overpassResponse.ok) {
      diagnostics.tests.overpass = {
        status: "PASSED",
        message: "OpenStreetMap Overpass API is accessible",
      }
    } else {
      diagnostics.tests.overpass = {
        status: "FAILED",
        error: `Overpass API returned ${overpassResponse.status}`,
      }
    }
  } catch (error) {
    diagnostics.tests.overpass = {
      status: "FAILED",
      error: "Cannot reach Overpass API",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Overall system status
  const failedTests = Object.values(diagnostics.tests).filter((test: any) => test.status === "FAILED")
  diagnostics.overallStatus = failedTests.length === 0 ? "HEALTHY" : "ISSUES_DETECTED"
  diagnostics.failedTestCount = failedTests.length
  diagnostics.totalTestCount = Object.keys(diagnostics.tests).length

  return NextResponse.json(diagnostics)
}
