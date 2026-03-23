import { createOpenAI } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { z } from 'zod'

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

export type ParsedSchedule = z.infer<typeof scheduleSchema>

export async function parseMessage(
  message: string,
  timezone?: string,
): Promise<ParsedSchedule> {
  const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || undefined,
  })

  const model = provider.chat(
    process.env.AI_MODEL_NAME || 'grok-4-1-fast-non-reasoning',
  )

  const tz = timezone || 'Asia/Shanghai'
  const now = new Date()
    .toLocaleString('sv-SE', { timeZone: tz })
    .replace(' ', 'T')

  const prompt = `Current time: ${now} (${tz}). Parse the following schedule request:\n\n"${message}"`

  const result = await generateText({
    model,
    output: Output.object({ schema: scheduleSchema }),
    prompt,
  })

  console.log('[AI] request:', JSON.stringify(result.request, null, 2))
  console.log('[AI] output:', JSON.stringify(result.output))
  if (!result.output) {
    throw new Error('AI returned empty output')
  }
  return result.output
}
