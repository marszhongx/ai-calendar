import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const scheduleSchema = z.object({
  title: z.string().describe('Short event title extracted from the message'),
  start_time: z.string().describe('Start time in ISO 8601 with UTC offset, e.g. "2026-03-20T23:00:00+08:00"'),
  end_time: z.optional(z.string()).describe('End time in ISO 8601 with UTC offset, e.g. "2026-03-20T23:30:00+08:00"'),
  timezone: z.string().describe('IANA timezone identifier, e.g. "Asia/Shanghai"'),
  reminder_minutes_before: z.number().describe('Minutes before event to send reminder. Default 10 if not specified'),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).describe('Recurrence frequency. NONE if not repeating'),
  notes: z.optional(z.string()).describe('Original user message as notes'),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
});

export type ParsedSchedule = z.infer<typeof scheduleSchema>;

export async function parseMessage(message: string): Promise<ParsedSchedule> {
  const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || undefined,
  });

  const model = provider.chat(process.env.AI_MODEL_NAME || 'grok-4-1-fast-non-reasoning');

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentWeekday = now.toLocaleDateString('en-US', { weekday: 'long' });

  const prompt = `Current date: ${currentDate} (${currentWeekday}). Parse the following schedule request and return structured data:\n\n"${message}"\n\nReturn the corresponding field data as required.`;

  const result = await generateText({
    model,
    output: Output.object({ schema: scheduleSchema }),
    prompt,
  });

  console.log('[AI] request:', JSON.stringify(result.request, null, 2));
  console.log('[AI] output:', JSON.stringify(result.output));
  return result.output!;
}
