import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, radius } = body;

    // Get API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not configured',
        details: 'Please set GEMINI_API_KEY in your environment variables.',
        solution: 'Add GEMINI_API_KEY=your_api_key to your .env.local file'
      }, { status: 500 });
    }

    // Mock response for now - replace with actual Gemini API call
    const mockResults = [
      {
        id: 1,
        name: "Sample Training Center",
        address: "123 Main St, Sample City",
        phone: "(555) 123-4567",
        website: "https://example.com",
        courses: ["Web Development", "Data Science", "AI/ML"],
        rating: 4.5,
        coordinates: [40.7128, -74.0060]
      }
    ];

    return NextResponse.json({
      success: true,
      results: mockResults,
      query,
      location,
      radius,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scrape-training-centers:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Training center scraper API',
    usage: 'Send POST request with query, location, and radius parameters'
  });
}
