import { explainDifficultPage } from '@/ai/flows/explain-difficult-page';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, apiKey } = await request.json();
    
    if (!imageUrl || !prompt || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await explainDifficultPage({
      imageUrl,
      prompt,
      apiKey
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}