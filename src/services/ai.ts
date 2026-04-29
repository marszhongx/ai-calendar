import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import type { ParsedSchedulePayload } from '../types/schedule'
import { getAiConfig } from './ai-config'

const scheduleSchema = z.object({
  title: z.string().describe('Short event title extracted from the message'),
  start_time: z
    .string()
    .describe('Start time in ISO 8601 UTC, e.g. "2026-03-20T15:00:00Z"'),
  end_time: z
    .string()
    .nullable()
    .describe('End time in ISO 8601 UTC, e.g. "2026-03-20T15:30:00Z"'),
  reminder_minutes_before: z
    .number()
    .describe(
      'Minutes before event to send reminder. Default 10 if not specified',
    ),
  recurrence: z
    .enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])
    .describe('Recurrence frequency. NONE if not repeating'),
  notes: z.string().nullable().describe('Original user message as notes'),
})

export async function parseMessage(
  message: string,
): Promise<ParsedSchedulePayload> {
  const config = await getAiConfig()
  if (!config.apiKey) {
    throw new Error('service_unavailable')
  }

  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  })

  const model = provider.chat(config.modelName)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date()
    .toLocaleString('sv-SE', { timeZone: tz })
    .replace(' ', 'T')

  const system =
    "Parse schedule requests and return only JSON that matches this TypeScript shape: { title: string; start_time: string; end_time: string | null; reminder_minutes_before: number; recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; notes: string | null }."
  const prompt = `Current time: ${now} (${tz}). Parse the following schedule request:\n\n"${message}"`

  const result = await generateText({
    model,
    system,
    prompt,
  })

  if (!result.text) {
    throw new Error('empty_response')
  }

  const parsed = JSON.parse(result.text)
  return scheduleSchema.parse(parsed) as ParsedSchedulePayload
}
