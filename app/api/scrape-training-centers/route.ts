import { type NextRequest, NextResponse } from "next/server"
import type { TrainingCenter, AreaBounds } from "@/types"

// Helper function to get API key from multiple sources
function getGeminiApiKey(): string | null {
  // Check multiple possible environment variable names and sources
  const possibleKeys = [
    process.env.GEMINI_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY,
    // Also check if it's passed through Next.js config
    process.env.NEXT_PUBLIC_VERCEL_ENV ? process.env.GEMINI_API_KEY : null,
  ]

  for (const key of possibleKeys) {
    if (key && key.trim().length > 0) {
      return key.trim()
    }
  }

  return null
}

// Helper function to categorize training centers
function categorizeTrainingCenter(name: string, description: string): "blue-collar" | "white-collar" | "other" {
  const text = `${name} ${description}`.toLowerCase()

  const blueCollarKeywords = [
    "welding",
    "construction",
    "automotive",
    "electrical",
    "plumbing",
    "hvac",
    "mechanic",
    "carpentry",
    "masonry",
    "trade",
    "skilled",
    "craft",
    "apprentice",
    "technical",
    "vocational",
    "industrial",
  ]

  const whiteCollarKeywords = [
    "business",
    "management",
    "finance",
    "accounting",
    "marketing",
    "sales",
    "consulting",
    "administration",
    "leadership",
    "professional",
    "corporate",
    "office",
    "analyst",
    "data",
    "software",
    "computer",
    "it",
    "technology",
    "digital",
  ]

  const blueCollarScore = blueCollarKeywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0)
  const whiteCollarScore = whiteCollarKeywords.reduce(
    (score, keyword) => (text.includes(keyword) ? score + 1 : score),
    0,
  )

  if (blueCollarScore > whiteCollarScore && blueCollarScore > 0) {
    return "blue-collar"
  } else if (whiteCollarScore > blueCollarScore && whiteCollarScore > 0) {
    return "white-collar"
  } else {
    return "other"
  }
}

// Function to get location name from coordinates
async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: {
        "User-Agent": "TrainingCenterMapper/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }

    const data = await response.json()
    const address = data.address || {}
    const city = address.city || address.town || address.village || address.hamlet
    const state = address.state || address.county
    const country = address.country

    if (city && state) {
      return `${city}, ${state}`
    } else if (city) {
      return city
    } else if (state && country) {
      return `${state}, ${country}`
    } else {
      return country || "Unknown Location"
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error)
    return "Unknown Location"
  }
}

// Function to search for real web content about training centers
async function searchWebContent(location: string, bounds: AreaBounds): Promise<string[]> {
  try {
    // Use DuckDuckGo Instant Answer API (free, no API key required)
    const searchQueries = [
      `training centers in ${location}`,
      `vocational schools ${location}`,
      `technical colleges ${location}`,
      `trade schools near ${location}`,
      `professional training ${location}`,
    ]

    const webContent: string[] = []

    for (const query of searchQueries) {
      try {
        // Use DuckDuckGo Instant Answer API
        const response = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        )

        if (response.ok) {
          const data = await response.json()

          // Extract relevant content
          if (data.Abstract) {
            webContent.push(`Search: ${query}\nContent: ${data.Abstract}`)
          }

          if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
              if (topic.Text) {
                webContent.push(`Related: ${topic.Text}`)
              }
            })
          }
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error searching for "${query}":`, error)
      }
    }

    // Also try to get educational institution data from OpenStreetMap
    try {
      const overpassQuery = `
        [out:json][timeout:15];
        (
          node["amenity"~"^(school|college|university|training)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["amenity"~"^(school|college|university|training)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body;
      `

      const osmResponse = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      })

      if (osmResponse.ok) {
        const osmData = await osmResponse.json()
        const elements = osmData.elements || []

        elements.forEach((element: any) => {
          if (element.tags && element.tags.name) {
            const tags = element.tags
            const info = [
              `Name: ${tags.name}`,
              tags.operator ? `Operator: ${tags.operator}` : "",
              tags.amenity ? `Type: ${tags.amenity}` : "",
              tags.description ? `Description: ${tags.description}` : "",
              tags.website ? `Website: ${tags.website}` : "",
              tags.phone ? `Phone: ${tags.phone}` : "",
              tags["addr:street"] ? `Address: ${tags["addr:street"]}` : "",
            ]
              .filter(Boolean)
              .join(", ")

            webContent.push(`OSM Educational Facility: ${info}`)
          }
        })
      }
    } catch (error) {
      console.error("Error fetching OSM data:", error)
    }

    return webContent
  } catch (error) {
    console.error("Error searching web content:", error)
    return []
  }
}

// Function to use Gemini to analyze and extract training center data from web content
async function analyzeWithGemini(
  webContent: string[],
  location: string,
  bounds: AreaBounds,
): Promise<TrainingCenter[]> {
  try {
    const geminiApiKey = getGeminiApiKey()

    console.log("=== Gemini API Key Check ===")
    console.log("Environment variables:")
    console.log("- NODE_ENV:", process.env.NODE_ENV)
    console.log("- GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY)
    console.log("- GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0)
    console.log("- NEXT_PUBLIC_GEMINI_API_KEY exists:", !!process.env.NEXT_PUBLIC_GEMINI_API_KEY)
    console.log("- GOOGLE_API_KEY exists:", !!process.env.GOOGLE_API_KEY)
    console.log("- Final API key found:", !!geminiApiKey)
    console.log("- Final API key length:", geminiApiKey?.length || 0)

    if (!geminiApiKey) {
      const errorMessage = `Gemini API key not found. Environment check:
        - GEMINI_API_KEY: ${!!process.env.GEMINI_API_KEY} (length: ${process.env.GEMINI_API_KEY?.length || 0})
        - NEXT_PUBLIC_GEMINI_API_KEY: ${!!process.env.NEXT_PUBLIC_GEMINI_API_KEY}
        - GOOGLE_API_KEY: ${!!process.env.GOOGLE_API_KEY}
        - GOOGLE_GEMINI_API_KEY: ${!!process.env.GOOGLE_GEMINI_API_KEY}
        
        Please ensure you have:
        1. Created a .env.local file in your project root
        2. Added: GEMINI_API_KEY=your_actual_api_key
        3. Restarted your development server
        4. Your API key should start with "AI" and be about 39 characters long
        
        Get a free API key at: https://ai.google.dev/`

      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    console.log("Using Gemini API key:", geminiApiKey.substring(0, 10) + "...")

    // Prepare the web content for analysis
    const contentText = webContent.join("\n\n---\n\n")

    const prompt = `
      You are a data analyst tasked with extracting real training center information from web search results and geographic data.

      LOCATION: ${location}
      GEOGRAPHIC BOUNDS: North: ${bounds.north}, South: ${bounds.south}, East: ${bounds.east}, West: ${bounds.west}

      WEB SEARCH RESULTS AND GEOGRAPHIC DATA:
      ${contentText}

      TASK: Analyze the provided web search results and geographic data to extract ONLY real, existing training centers, vocational schools, technical colleges, and professional training facilities in or near ${location}.

      REQUIREMENTS:
      1. Extract ONLY facilities that are mentioned in the provided data
      2. Do NOT create or invent any information not present in the source data
      3. For each real facility found, extract available information
      4. If address information is incomplete, use the general location area
      5. Generate realistic coordinates within the specified bounds for each facility
      6. If contact information is not available in the source, leave those fields empty

      OUTPUT FORMAT: Return a JSON array with this exact structure for each REAL facility found:
      [
        {
          "name": "Exact name from source data",
          "address": "Address if available, or general area",
          "description": "Description based on source information",
          "phone": "Phone number if mentioned, or empty string",
          "website": "Website if mentioned, or empty string", 
          "email": "Email if mentioned, or empty string",
          "lat": latitude_within_bounds,
          "lng": longitude_within_bounds,
          "source": "Brief description of where this information was found"
        }
      ]

      If no real training centers are found in the provided data, return an empty array [].
      
      IMPORTANT: Only extract information that actually exists in the provided web search results and geographic data. Do not generate fictional facilities.
    `

    console.log("Analyzing web content with Gemini API...")

    // Updated to use gemini-2.0-flash model instead of gemini-pro
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Low temperature for factual extraction
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error response:", errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      throw new Error("No response from Gemini API")
    }

    console.log("Gemini analysis response:", textResponse)

    // Extract JSON from the response
    const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)

    if (!jsonMatch) {
      console.log("No JSON found in Gemini response, checking for empty array...")
      if (textResponse.includes("[]") || textResponse.toLowerCase().includes("no real training centers")) {
        return []
      }
      throw new Error("Could not extract JSON from Gemini response")
    }

    // Parse the JSON
    const extractedCenters = JSON.parse(jsonMatch[0])

    // Transform to our TrainingCenter type
    return extractedCenters.map((center: any, index: number) => {
      // Ensure coordinates are within bounds
      const lat = Math.min(Math.max(Number(center.lat), bounds.south), bounds.north)
      const lng = Math.min(Math.max(Number(center.lng), bounds.west), bounds.east)

      // Categorize based on name and description
      const category = categorizeTrainingCenter(center.name, center.description)

      return {
        id: `gemini-extracted-${index}-${Date.now()}`,
        name: center.name,
        category,
        address: center.address || `${location} area`,
        phone: center.phone || undefined,
        email: center.email || undefined,
        website: center.website || undefined,
        description: `${center.description} (Source: ${center.source})`,
        coordinates: {
          lat,
          lng,
        },
      }
    })
  } catch (error) {
    console.error("Error analyzing with Gemini API:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Training Center Extraction Request ===")
    console.log("Timestamp:", new Date().toISOString())
    console.log("Environment variables check:")
    console.log("- NODE_ENV:", process.env.NODE_ENV)
    console.log(
      "- All env vars with 'GEMINI':",
      Object.keys(process.env).filter((k) => k.includes("GEMINI")),
    )
    console.log(
      "- All env vars with 'GOOGLE':",
      Object.keys(process.env).filter((k) => k.includes("GOOGLE")),
    )

    // Early API key check with detailed logging
    const geminiApiKey = getGeminiApiKey()

    console.log("API Key check results:")
    console.log("- process.env.GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY?.length || 0)
    console.log("- process.env.NEXT_PUBLIC_GEMINI_API_KEY:", !!process.env.NEXT_PUBLIC_GEMINI_API_KEY)
    console.log("- Final geminiApiKey found:", !!geminiApiKey)

    if (!geminiApiKey) {
      console.error("No Gemini API key found in environment variables")
      return NextResponse.json(
        {
          error: "Gemini API key is not configured",
          details: `Please set GEMINI_API_KEY in your environment variables. 
          
          Steps to fix:
          1. Create a .env.local file in your project root directory
          2. Add this line: GEMINI_API_KEY=your_actual_api_key
          3. Restart your development server (npm run dev)
          4. Make sure the .env.local file is in the same directory as package.json
          
          Current environment check:
          - GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}
          - NEXT_PUBLIC_GEMINI_API_KEY exists: ${!!process.env.NEXT_PUBLIC_GEMINI_API_KEY}
          - Working directory: ${process.cwd()}`,
          success: false,
          timestamp: new Date().toISOString(),
          troubleshooting: {
            step1: "Create .env.local file in project root",
            step2: "Add GEMINI_API_KEY=your_key_here",
            step3: "Restart development server",
            step4: "Check file is in same directory as package.json",
            getApiKey: "Get a free API key at https://ai.google.dev/",
          },
        },
        { status: 500 },
      )
    }

    const { bounds }: { bounds: AreaBounds } = await request.json()

    console.log("Bounds received:", bounds)

    // Validate bounds
    if (
      !bounds ||
      typeof bounds.north !== "number" ||
      typeof bounds.south !== "number" ||
      typeof bounds.east !== "number" ||
      typeof bounds.west !== "number"
    ) {
      return NextResponse.json({ error: "Invalid bounds provided" }, { status: 400 })
    }

    console.log("Starting real data extraction for bounds:", bounds)

    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2

    // Get location name for context
    const locationName = await getLocationName(centerLat, centerLng)
    console.log("Location identified as:", locationName)

    // Search for real web content about training centers in this area
    console.log("Searching for real web content...")
    const webContent = await searchWebContent(locationName, bounds)
    console.log(`Found ${webContent.length} pieces of web content`)

    if (webContent.length === 0) {
      return NextResponse.json({
        success: false,
        error:
          "No training center information found for this location. Try selecting a different area or a larger region.",
        centers: [],
        bounds,
        sources: {
          webContent: 0,
          geminiAnalysis: false,
        },
      })
    }

    // Use Gemini to analyze and extract real training center data
    console.log("Analyzing web content with Gemini...")
    const trainingCenters = await analyzeWithGemini(webContent, locationName, bounds)
    console.log(`Gemini extracted ${trainingCenters.length} real training centers`)

    if (trainingCenters.length === 0) {
      return NextResponse.json({
        success: false,
        error:
          "No training centers could be extracted from the available data for this location. The area may not have training facilities or they may not be well-documented online.",
        centers: [],
        bounds,
        sources: {
          webContent: webContent.length,
          geminiAnalysis: true,
          extractedCenters: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      centers: trainingCenters,
      bounds,
      scraped: true,
      sources: {
        webContent: webContent.length,
        geminiAnalysis: true,
        extractedCenters: trainingCenters.length,
      },
      message: `Successfully extracted ${trainingCenters.length} real training centers from web data using Gemini AI analysis`,
    })
  } catch (error) {
    console.error("=== Error in real data extraction ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Timestamp:", new Date().toISOString())

    // Provide specific error messages based on error type
    let userMessage = "Failed to extract real training center data"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("Gemini API key not found")) {
        userMessage = "Gemini API key is not configured. Please set up your API key in environment variables."
        statusCode = 500
      } else if (error.message.includes("Gemini API error")) {
        userMessage = "Error connecting to Gemini AI service. Please check your API key and try again."
        statusCode = 500
      } else if (error.message.includes("fetch")) {
        userMessage = "Network error occurred while fetching data. Please check your internet connection."
        statusCode = 500
      }
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          checkApiKey: "Ensure GEMINI_API_KEY is set in .env.local file",
          getApiKey: "Get a free API key at https://ai.google.dev/",
          checkNetwork: "Verify internet connection and firewall settings",
          runDiagnostics: "Use the Debug panel to run system diagnostics",
          fileLocation: "Make sure .env.local is in project root (same level as package.json)",
          restartServer: "Restart development server after adding environment variables",
        },
      },
      { status: statusCode },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Training center scraper API',
    usage: 'Send POST request with query, location, and radius parameters'
  });
}
