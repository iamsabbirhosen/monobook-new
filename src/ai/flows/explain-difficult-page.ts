'use server';

/**
 * @fileOverview AI flow to explain a difficult page of a book.
 *
 * - explainDifficultPage - A function that explains the content of a difficult page.
 * - ExplainDifficultPageInput - The input type for the explainDifficultPage function.
 * - ExplainDifficultPageOutput - The return type for the explainDifficultPage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const ExplainDifficultPageInputSchema = z.object({
  imageUrl: z.string().describe('The URL of the page image to analyze'),
  prompt: z.string().describe('The prompt to send to Gemini'),
  apiKey: z.string().describe('The Gemini API key'),
});
export type ExplainDifficultPageInput = z.infer<typeof ExplainDifficultPageInputSchema>;

const ExplainDifficultPageOutputSchema = z.object({
  explanation: z
    .string()
    .describe('The explanation of the page content in an easy-to-understand way.'),
});
export type ExplainDifficultPageOutput = z.infer<typeof ExplainDifficultPageOutputSchema>;

export async function explainDifficultPage(
  input: ExplainDifficultPageInput
): Promise<ExplainDifficultPageOutput> {
  return explainDifficultPageFlow(input);
}

const getImageBuffer = async (imageUrl: string): Promise<Buffer> => {
  try {
    let imagePath: string;
    let imageBuffer: Buffer;

    if (imageUrl.startsWith('http')) {
      // For remote URLs, fetch the image directly
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // For local paths
      const urlParts = imageUrl.split('/');
      const bookId = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];
      imagePath = path.join(process.cwd(), 'public', 'pdfbooks', bookId, fileName);
      imageBuffer = await fs.promises.readFile(imagePath);
    }

    return imageBuffer;
  } catch (error) {
    console.error('Error getting image data:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process image');
  }
};

const analyzeImage = async (imageUrl: string, prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Invalid API key: API key is required');
  }

  try {
    console.log('Processing image:', imageUrl);

    let imageBuffer: Buffer;
    
    // If it's a complete URL (from Vercel deployment)
    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      console.log('Successfully fetched image from URL');
    } else {
      // For local development, read from filesystem
      const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      
      try {
        await fs.promises.access(fullPath, fs.constants.R_OK);
        imageBuffer = await fs.promises.readFile(fullPath);
        console.log('Successfully read image from local filesystem');
      } catch (error) {
        console.error('File access error:', error);
        // Try fetching from Vercel URL as fallback
        const vercelUrl = `https://monobook-new.vercel.app${imageUrl}`;
        console.log('Attempting to fetch from Vercel:', vercelUrl);
        const response = await fetch(vercelUrl);
        if (!response.ok) {
          throw new Error(`Image not found locally or on Vercel: ${imageUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        console.log('Successfully fetched image from Vercel');
      }
    }
    
    const base64Data = imageBuffer.toString('base64');
    console.log('Image loaded successfully');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }); // Using vision model

    const promptText = `This is a page from a Bengali (Bangla) textbook. Please analyze this image and:

1. First, carefully read and understand the Bengali text shown in the image
2. Provide an accurate English translation of the Bengali text
3. Explain the main concepts and ideas presented in the text
4. Give practical examples to help understand the concepts
5. List the key points to remember

Important: Please focus on accurate translation and clear explanation of the Bengali text.

Please format your response as:
1. English Translation
2. Main Concepts Explanation
3. Real-world Examples
4. Key Points to Remember
5. Practice Questions (if relevant)`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent([
      {
        text: promptText
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      }
    ]);    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text.substring(0, 100) + '...');
    
    return text;
  } catch (error) {
    console.error('Error in analyzeImage:', error);
    if (error instanceof Error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    } else {
      throw new Error('Image analysis failed: Unknown error');
    }
  }
};

const explainDifficultPageFlow = ai.defineFlow(
  {
    name: 'explainDifficultPageFlow',
    inputSchema: ExplainDifficultPageInputSchema,
    outputSchema: ExplainDifficultPageOutputSchema,
  },
  async input => {
    const explanation = await analyzeImage(input.imageUrl, input.prompt, input.apiKey);
    return { explanation };
    return { explanation };
  }
);
