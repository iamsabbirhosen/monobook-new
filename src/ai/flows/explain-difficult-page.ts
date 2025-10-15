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

const getImageBase64 = async (imageUrl: string): Promise<string> => {
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

    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error getting image data:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process image');
  }
};

const analyzeImage = async (imageUrl: string, prompt: string, apiKey: string) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Invalid API key: API key is required');
  }

  try {
    // Get image data
    console.log('Processing image...');
    const base64Image = await getImageBase64(imageUrl);
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }); // Using vision model

    const promptText = `This is a page from a Bengali (Bangla) textbook. Please:
1. Read and understand the Bengali text in the image
2. Translate it to English
3. Explain the content like an ideal teacher with examples
4. Provide key points and practice questions if applicable

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
          data: base64Image
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
