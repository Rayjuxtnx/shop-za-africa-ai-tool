import { config } from 'dotenv';
config();

import '@/ai/schemas.ts';
import '@/ai/flows/answer-fact-based-questions.ts';
import '@/ai/flows/summarize-text.ts';
import '@/ai/flows/aether-chat.ts';
import '@/ai/flows/creative-writing.ts';
