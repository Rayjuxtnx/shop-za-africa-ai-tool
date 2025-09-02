'use server';

import { aetherChat } from '@/ai/flows/aether-chat';
import { AetherChatInputSchema } from '@/ai/schemas';
import { z } from 'zod';

export async function getAiResponse(input: z.infer<typeof AetherChatInputSchema>): Promise<{ data?: string; error?: string }> {
  const parsedInput = AetherChatInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const response = await aetherChat(parsedInput.data);
    return { data: response };
  } catch (error) {
    console.error('Error getting AI response:', error);
    return { error: 'I had trouble connecting to my brain. Please check your configuration and try again.' };
  }
}
