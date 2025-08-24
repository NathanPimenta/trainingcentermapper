import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json({
        status: "error",
        error: "Gemini API key not configured",
        timestamp: new Date().toISOString(),
      })
    }

    // Check if the API is accessible and working
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=${geminiApiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: `Gemini API returned ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Get model information
    const modelInfo = await response.json()

    // Test a simple generation to ensure the API is fully functional
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
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
                  text: "Respond with 'API is working' if you can read this message.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 10,
          },
        }),
      },
    )

    if (!testResponse.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: `Gemini API generation test failed: ${testResponse.status}`,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    const testData = await testResponse.json()
    const testText = testData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!testText || !testText.includes("API is working")) {
      return NextResponse.json(
        {
          status: "error",
          error: "Gemini API response validation failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      message: "Gemini API is connected and working properly",
      modelInfo: {
        model: modelInfo.name,
        version: modelInfo.version,
        displayName: modelInfo.displayName,
        description: modelInfo.description,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error checking Gemini API",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
