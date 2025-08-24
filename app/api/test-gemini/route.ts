import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, testType = 'basic' } = body;

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
        },
        troubleshooting: {
          checkFile: "Ensure .env.local exists in project root",
          checkFormat: "Format should be: GEMINI_API_KEY=your_key_here",
          checkRestart: "Restart dev server after adding environment variables",
          checkLocation: "File must be in same directory as package.json"
        }
      }, { status: 500 });
    }

    console.log(`Testing Gemini API with test type: ${testType}`);
    console.log(`API Key found: ${!!geminiApiKey} (length: ${geminiApiKey?.length || 0})`);

    let prompt = '';
    let model = 'gemini-pro';

    // Different test types for comprehensive testing
    switch (testType) {
      case 'creative':
        prompt = `You are a creative writing assistant. Write a short, imaginative story about: "${message || 'a magical training center'}"`;
        break;
      case 'analytical':
        prompt = `You are a data analyst. Analyze this topic and provide insights: "${message || 'the future of vocational training'}"`;
        break;
      case 'technical':
        prompt = `You are a technical expert. Explain this concept in simple terms: "${message || 'machine learning in education'}"`;
        break;
      case 'training':
        prompt = `You are a training consultant. Provide advice on: "${message || 'setting up a vocational training program'}"`;
        break;
      default:
        prompt = `You are a helpful AI assistant. Please respond to this message: "${message || 'Hello, how are you?'}"`;
    }

    console.log(`Sending prompt to Gemini API: ${prompt.substring(0, 100)}...`);

    // Test Gemini API with the selected prompt
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: testType === 'creative' ? 0.9 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      
      let errorDetails = 'Unknown API error';
      if (response.status === 400) {
        errorDetails = 'Bad request - check your API key and request format';
      } else if (response.status === 401) {
        errorDetails = 'Unauthorized - invalid API key';
      } else if (response.status === 403) {
        errorDetails = 'Forbidden - API key may have restrictions';
      } else if (response.status === 429) {
        errorDetails = 'Rate limited - too many requests';
      } else if (response.status >= 500) {
        errorDetails = 'Gemini service error - try again later';
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response content from Gemini API');
    }

    // Check for safety blocks
    if (data.promptFeedback?.blockReason) {
      return NextResponse.json({
        success: false,
        error: 'Content blocked by safety filters',
        blockReason: data.promptFeedback.blockReason,
        details: 'Your request was flagged as potentially harmful content',
        suggestion: 'Try rephrasing your request or using a different approach'
      }, { status: 400 });
    }

    console.log(`Gemini API response received (${textResponse.length} characters)`);

    return NextResponse.json({
      success: true,
      message: textResponse,
      timestamp: new Date().toISOString(),
      model: model,
      testType: testType,
      prompt: prompt,
      responseLength: textResponse.length,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 'unknown',
        responseTokens: data.usageMetadata?.candidatesTokenCount || 'unknown',
        totalTokens: data.usageMetadata?.totalTokenCount || 'unknown'
      }
    });

  } catch (error) {
    console.error('Error in test-gemini:', error);
    
    let errorMessage = 'Failed to test Gemini API';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;

    // Provide helpful error messages
    if (errorDetails.includes('API key')) {
      errorMessage = 'API key configuration error';
      statusCode = 500;
    } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
      errorMessage = 'Network connection error';
      statusCode = 503;
    } else if (errorDetails.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded';
      statusCode = 429;
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      success: false,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        checkApiKey: "Verify GEMINI_API_KEY is set in .env.local",
        checkNetwork: "Check your internet connection",
        checkRateLimit: "Wait a moment before trying again",
        checkGeminiStatus: "Check if Gemini service is available"
      }
    }, { status: statusCode });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gemini API test endpoint',
    usage: 'Send POST request with a message to test Gemini API integration',
    testTypes: [
      'basic - Simple conversation',
      'creative - Creative writing',
      'analytical - Data analysis',
      'technical - Technical explanation',
      'training - Training consultation'
    ],
    example: {
      method: 'POST',
      body: {
        message: 'Hello, how are you?',
        testType: 'basic'
      }
    }
  });
}
