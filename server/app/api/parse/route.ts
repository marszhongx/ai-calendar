import { NextResponse } from 'next/server'
import { parseMessage } from '@/lib/ai'
import { requireDeviceId } from '@/lib/device-id'
import { parseJsonBody } from '@/lib/validate'

export async function POST(request: Request) {
  const { error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { message, timezone } = body as { message?: string; timezone?: string }

  if (!message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  try {
    const parsed = await parseMessage(message, timezone)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI parse error:', error)
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 },
    )
  }
}
