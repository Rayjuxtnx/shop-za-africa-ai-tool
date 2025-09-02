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

export const CreativeWritingInputSchema = z.object({
  topic: z.string().describe('The topic for the creative writing piece.'),
});
export type CreativeWritingInput = z.infer<typeof CreativeWritingInputSchema>;

export const CreativeWritingOutputSchema = z.object({
  creativeText: z
    .string()
    .describe('The generated creative text (story, poem, etc.).'),
});
export type CreativeWritingOutput = z.infer<typeof CreativeWritingOutputSchema>;

export const AetherChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  question: z.string(),
});
export type AetherChatInput = z.infer<typeof AetherChatInputSchema>;
