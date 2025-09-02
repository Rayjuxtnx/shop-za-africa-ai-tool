/**
 * @fileOverview This file contains the Zod schemas for the AI flows.
 */

import {z} from 'genkit';

export const AnswerFactBasedQuestionInputSchema = z.object({
  question: z.string().describe('The fact-based question to be answered.'),
});
export type AnswerFactBasedQuestionInput = z.infer<
  typeof AnswerFactBasedQuestionInputSchema
>;

export const AnswerFactBasedQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the fact-based question.'),
});
export type AnswerFactBasedQuestionOutput = z.infer<
  typeof AnswerFactBasedQuestionOutputSchema
>;

export const SummarizeTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

export const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The summary of the text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;
