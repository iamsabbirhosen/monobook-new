'use server';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Remove leading slash if present
    const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const imagePath = path.join(process.cwd(), 'public', relativePath);

    // Verify file exists
    try {
      await fs.promises.access(imagePath, fs.constants.R_OK);
    } catch (error) {
      console.error('File access error:', error);
      return NextResponse.json({ 
        error: `Image file not found: ${relativePath}` 
      }, { status: 404 });
    }

    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    return NextResponse.json({ 
      imageData: `data:image/jpeg;base64,${base64Image}` 
    });
  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process image' 
    }, { status: 500 });
  }
}