import { NextResponse } from 'next/server'
import { parseMessage } from '@/lib/ai'

export async function POST(request: Request) {
  const body = await request.json()
  const { message, deviceId } = body

  if (!message || !deviceId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  try {
    const parsed = await parseMessage(message)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI parse error:', error)
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 },
    )
  }
}
