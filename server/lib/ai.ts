import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const scheduleSchema = z.object({
  title: z.string().describe('Schedule title'),
  start_time: z.string().describe('Start time in ISO 8601 format'),
  end_time: z.optional(z.string()).describe('End time in ISO 8601 format'),
  timezone: z.optional(z.string()).describe('Timezone identifier'),
  reminder_minutes_before: z.optional(z.number()).describe('Minutes before to send reminder'),
  recurrence: z.optional(z.string()).describe('Recurrence frequency'),
  notes: z.optional(z.string()).describe('Additional notes'),
  confidence: z.optional(z.number()).describe('Confidence score between 0 and 1'),
});

export type ParsedSchedule = z.infer<typeof scheduleSchema>;

export async function parseMessage(message: string): Promise<ParsedSchedule> {
  const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || undefined,
  });

  const model = provider.chat(process.env.AI_MODEL_NAME || 'grok-4-1-fast-non-reasoning');

  const result = await generateObject({
    model,
    schema: scheduleSchema,
    prompt: `Parse the following schedule request and return structured data:\n\n"${message}"\n\nReturn the corresponding field data as required.`,
  });

  return result.object;
}
