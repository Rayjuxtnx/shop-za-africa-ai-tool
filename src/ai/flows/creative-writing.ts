'use server';

/**
 * @fileOverview A creative writing AI agent.
 *
 * - creativeWriting - A function that handles the creative writing process.
 * - CreativeWritingInput - The input type for the creativeWriting function.
 * - CreativeWritingOutput - The return type for the creativeWriting function.
 */

import {ai} from '@/ai/genkit';
import type {
  CreativeWritingInput,
  CreativeWritingOutput,
} from '@/ai/schemas';
import {
  CreativeWritingInputSchema,
  CreativeWritingOutputSchema,
} from '@/ai/schemas';

export async function creativeWriting(
  input: CreativeWritingInput
): Promise<CreativeWritingOutput> {
  return creativeWritingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'creativeWritingPrompt',
  input: {schema: CreativeWritingInputSchema},
  output: {schema: CreativeWritingOutputSchema},
  prompt: `You are a creative writer. Write a short story or poem about the following topic: {{{topic}}}`,
});

const creativeWritingFlow = ai.defineFlow(
  {
    name: 'creativeWritingFlow',
    inputSchema: CreativeWritingInputSchema,
    outputSchema: CreativeWritingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
