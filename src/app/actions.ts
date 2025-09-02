'use server';

import { aetherChat } from '@/ai/flows/aether-chat';

export async function getAiResponse(question: string): Promise<{ data?: string; error?: string }> {
  if (!question) {
    return { error: 'Question is required.' };
  }

  try {
    const response = await aetherChat(question);
    return { data: response };
  } catch (error) {
    console.error('Error getting AI response:', error);
    return { error: 'I had trouble connecting to my brain. Please check your configuration and try again.' };
  }
}
