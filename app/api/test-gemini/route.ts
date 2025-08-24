import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Get API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        details: 'Please set GEMINI_API_KEY in your environment variables.',
        solution: 'Add GEMINI_API_KEY=your_api_key to your .env.local file',
        instructions: {
          step1: "Create a .env.local file in your project root directory",
          step2: "Add this exact line: GEMINI_API_KEY=your_actual_api_key_here",
          step3: "Make sure the file is in the same directory as package.json",
          step4: "Restart your development server (npm run dev)",
          getApiKey: "Get a free API key at https://ai.google.dev/"
        }
      }, { status: 500 });
    }

    // Test Gemini API with a simple prompt
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful AI assistant. Please respond to this message: "${message || 'Hello, how are you?'}"`
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from Gemini API');
    }

    return NextResponse.json({
      success: true,
      message: textResponse,
      timestamp: new Date().toISOString(),
      model: 'gemini-pro'
    });

  } catch (error) {
    console.error('Error in test-gemini:', error);
    return NextResponse.json({
      error: 'Failed to test Gemini API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gemini API test endpoint',
    usage: 'Send POST request with a message to test Gemini API integration'
  });
}
