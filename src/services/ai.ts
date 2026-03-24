import { createOpenAI } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getAiConfig } from '../config/ai-config'
import type { ParsedSchedulePayload } from '../types'

const scheduleSchema = z.object({
  title: z.string().describe('Short event title extracted from the message'),
  start_time: z
    .string()
    .describe('Start time in ISO 8601 UTC, e.g. "2026-03-20T15:00:00Z"'),
  end_time: z
    .optional(z.string())
    .describe('End time in ISO 8601 UTC, e.g. "2026-03-20T15:30:00Z"'),
  reminder_minutes_before: z
    .number()
    .describe(
      'Minutes before event to send reminder. Default 10 if not specified',
    ),
  recurrence: z
    .enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])
    .describe('Recurrence frequency. NONE if not repeating'),
  notes: z.optional(z.string()).describe('Original user message as notes'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score between 0 and 1'),
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

  const prompt = `Current time: ${now} (${tz}). Parse the following schedule request:\n\n"${message}"`

  const result = await generateText({
    model,
    output: Output.object({ schema: scheduleSchema }),
    prompt,
  })

  if (!result.output) {
    throw new Error('empty_response')
  }

  return result.output as ParsedSchedulePayload
}
