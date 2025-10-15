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

    const promptText = `You are analyzing a page from a Bengali Biology textbook (বায়োলজি ১ম পত্র). As an expert teacher, please provide a comprehensive educational explanation of this page.

Please analyze and explain following this structure:

1. Content Overview:
   - Identify the main biological topic or concept
   - Note any diagrams, illustrations, or visual elements
   - Provide context within the broader subject

2. Detailed Translation & Terminology:
   - Provide an accurate Bengali to English translation
   - Maintain scientific terminology accuracy
   - Define any technical terms or new vocabulary
   - Keep important Bengali scientific terms alongside English translations

3. Concept Explanation:
   - Break down complex biological concepts into simple terms
   - Explain processes step by step
   - Connect to fundamental biological principles
   - Use analogies when helpful

4. Visual Analysis (if diagrams present):
   - Explain diagrams or illustrations in detail
   - Translate and explain all labels
   - Connect visuals to the main text
   - Highlight important features

5. Real-World Applications:
   - Provide examples from everyday life
   - Connect to observable biological phenomena
   - Explain practical significance
   - Share relevant real-world scenarios

6. Key Learning Points:
   - List 3-5 essential takeaways
   - Highlight crucial terminology
   - Note important relationships or processes
   - Emphasize exam-relevant points

7. Study Tips:
   - Share effective memorization techniques
   - Suggest practical study methods
   - Provide exam-focused tips
   - Recommend related topics to explore

8. Check Understanding:
   - Include 2-3 practice questions
   - Provide thought-provoking discussion points
   - Add self-assessment prompts

Please use a friendly, encouraging teaching tone throughout your explanation. Break down complex concepts into digestible parts, assuming the reader is a high school student learning Biology. Format your response with clear headings and bullet points for easy reading.`;

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
