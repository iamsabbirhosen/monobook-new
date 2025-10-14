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

const ExplainDifficultPageInputSchema = z.object({
  pageContent: z
    .string()
    .describe('The content of the current page that needs explanation.'),
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

const prompt = ai.definePrompt({
  name: 'explainDifficultPagePrompt',
  input: {schema: ExplainDifficultPageInputSchema},
  output: {schema: ExplainDifficultPageOutputSchema},
  prompt: `Teach the following content in the same language as the book in the easiest way possible:

Content: {{{pageContent}}}`,
});

const explainDifficultPageFlow = ai.defineFlow(
  {
    name: 'explainDifficultPageFlow',
    inputSchema: ExplainDifficultPageInputSchema,
    outputSchema: ExplainDifficultPageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
