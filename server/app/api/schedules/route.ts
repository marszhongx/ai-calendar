import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const deviceId = searchParams.get('deviceId')

  if (!deviceId) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.deviceId, deviceId))
    .orderBy(asc(schema.schedules.startAt))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    deviceId,
    title,
    startAt,
    endAt,
    timezone,
    reminderMinutesBefore,
    recurrence,
    notes,
    originalMessage,
  } = body

  if (!deviceId || !title || !startAt) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  const rows = await db
    .insert(schema.schedules)
    .values({
      deviceId,
      title,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      timezone: timezone || 'Asia/Shanghai',
      reminderMinutesBefore: reminderMinutesBefore || 30,
      recurrence: recurrence || 'NONE',
      notes: notes || '',
      originalMessage: originalMessage || '',
    })
    .returning()

  return NextResponse.json(rows[0], { status: 201 })
}
