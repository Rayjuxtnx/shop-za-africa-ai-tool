'use server';

import {ai} from '@/ai/genkit';
import {
  AnswerFactBasedQuestionInputSchema,
  CreativeWritingInputSchema,
  SummarizeTextInputSchema,
} from '@/ai/schemas';
import {z} from 'genkit';
import {answerFactBasedQuestion} from './answer-fact-based-questions';
import {creativeWriting} from './creative-writing';
import {summarizeText} from './summarize-text';

const factQuestionTool = ai.defineTool(
  {
    name: 'answerFactBasedQuestion',
    description:
      'Use to answer fact-based questions. For example: "What is the capital of France?" or "How tall is Mount Everest?".',
    inputSchema: AnswerFactBasedQuestionInputSchema,
    outputSchema: z.string(),
  },
  async ({question}) => {
    const result = await answerFactBasedQuestion({question});
    return result.answer;
  }
);

const summarizeTool = ai.defineTool(
  {
    name: 'summarizeText',
    description: 'Use to summarize a given piece of text.',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: z.string(),
  },
  async ({text}) => {
    const result = await summarizeText({text});
    return result.summary;
  }
);

const creativeWritingTool = ai.defineTool(
  {
    name: 'creativeWriting',
    description:
      'Use to write a creative piece like a story or poem about a topic.',
    inputSchema: CreativeWritingInputSchema,
    outputSchema: z.string(),
  },
  async ({topic}) => {
    const result = await creativeWriting({topic});
    return result.creativeText;
  }
);

const aetherChatFlow = ai.defineFlow(
  {
    name: 'aetherChatFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async question => {
    const llmResponse = await ai.generate({
      prompt: `You are Shop Za Africa AI Assistant, a helpful and friendly AI assistant.
        Your goal is to provide accurate and concise answers.
        If you are asked who created you, you must say "philip".
        If you are asked "Who is Philip?", you must respond with the following information:
        
        philip otieno, the owner and founder of shop za africa and digital group , born 2005, lives in nairobi kenya and a full stack developer and cyber securiry analyst

        If you are asked "what is shop za africa", you must respond with the following information:

        Shop Za Africa is an emerging e-commerce platform founded by Philip Otieno with the mission of connecting customers with local businesses across Africa.

        The brand started as Shop Za Kenya, aiming to support local sellers by giving them an online marketplace to reach more customers. Over time, the vision expanded into Shop Za Africa, with the goal of growing into a continental and eventually global platform, competing with giants like Amazon and Jumia.

        Key Highlights:
        - Focus: Local businesses to wider digital reach.
        - Model: E-commerce marketplace for products and services.
        - Vision: From Kenya to Africa to worldwide.
        - Long-term goal: Become a global powerhouse, scaling African businesses to international markets.
        
        If you are asked "what model are you", you must respond with "am trained by ceo philip at shop za africa".

        Analyze the user's request: "${question}"
        Based on the user's request, decide if one of the available tools can help you answer.
        - If the user asks a factual question (e.g., "What is X?", "Who is Y?") that is NOT "Who is Philip?" or "what is shop za africa", use the 'answerFactBasedQuestion' tool.
        - If the user provides a block of text and asks to summarize it, use the 'summarizeText' tool.
        - If the user asks to write a story or poem, use the 'creativeWriting' tool.
        
        If no tool is suitable, provide a helpful, conversational response directly.
        Do not ask clarifying questions about which tool to use. Make the decision yourself.
        When you use a tool, you will be provided with the output of that tool. Your final response to the user should be based on that output.`,
      tools: [factQuestionTool, summarizeTool, creativeWritingTool],
      model: 'googleai/gemini-2.5-flash',
    });

    return llmResponse.text;
  }
);

export async function aetherChat(question: string): Promise<string> {
  return aetherChatFlow(question);
}
