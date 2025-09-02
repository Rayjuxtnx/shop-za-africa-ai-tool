'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering fact-based questions.
 *
 * - answerFactBasedQuestion - A function that takes a question as input and returns an answer.
 * - AnswerFactBasedQuestionInput - The input type for the answerFactBasedQuestion function.
 * - AnswerFactBasedQuestionOutput - The return type for the answerFactBasedQuestion function.
 */

import {ai} from '@/ai/genkit';
import type { AnswerFactBasedQuestionInput, AnswerFactBasedQuestionOutput } from '@/ai/schemas';
import { AnswerFactBasedQuestionInputSchema, AnswerFactBasedQuestionOutputSchema } from '@/ai/schemas';

export async function answerFactBasedQuestion(
  input: AnswerFactBasedQuestionInput
): Promise<AnswerFactBasedQuestionOutput> {
  return answerFactBasedQuestionFlow(input);
}

const answerFactBasedQuestionPrompt = ai.definePrompt({
  name: 'answerFactBasedQuestionPrompt',
  input: {schema: AnswerFactBasedQuestionInputSchema},
  output: {schema: AnswerFactBasedQuestionOutputSchema},
  prompt: `You are an AI assistant that answers fact-based questions accurately and concisely.\n\nQuestion: {{{question}}}\n\nAnswer:`,
});

const answerFactBasedQuestionFlow = ai.defineFlow(
  {
    name: 'answerFactBasedQuestionFlow',
    inputSchema: AnswerFactBasedQuestionInputSchema,
    outputSchema: AnswerFactBasedQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerFactBasedQuestionPrompt(input);
    return output!;
  }
);
