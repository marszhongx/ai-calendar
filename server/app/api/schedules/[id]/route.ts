import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireDeviceId } from '@/lib/device-id'
import { isValidDate, isValidRecurrence, parseJsonBody } from '@/lib/validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: RouteContext) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { id } = await params

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { title, startAt, endAt, reminderMinutesBefore, recurrence, notes } =
    body as Record<string, unknown>

  if (
    !title ||
    typeof title !== 'string' ||
    !startAt ||
    typeof startAt !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (title.length > 200) {
    return NextResponse.json({ error: 'Title too long' }, { status: 400 })
  }

  if (typeof notes === 'string' && notes.length > 2000) {
    return NextResponse.json({ error: 'Notes too long' }, { status: 400 })
  }

  if (!isValidDate(startAt)) {
    return NextResponse.json({ error: 'Invalid startAt date' }, { status: 400 })
  }

  if (endAt && typeof endAt === 'string') {
    if (!isValidDate(endAt)) {
      return NextResponse.json({ error: 'Invalid endAt date' }, { status: 400 })
    }
    if (new Date(endAt) <= new Date(startAt)) {
      return NextResponse.json(
        { error: 'endAt must be after startAt' },
        { status: 400 },
      )
    }
  }

  const reminder =
    typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : 30
  if (!Number.isInteger(reminder) || reminder < 0 || reminder > 1440) {
    return NextResponse.json(
      { error: 'reminderMinutesBefore must be 0-1440' },
      { status: 400 },
    )
  }

  const rec = typeof recurrence === 'string' ? recurrence : 'NONE'
  if (!isValidRecurrence(rec)) {
    return NextResponse.json(
      { error: 'Invalid recurrence value' },
      { status: 400 },
    )
  }

  const rows = await db
    .update(schema.schedules)
    .set({
      title,
      startAt: new Date(startAt),
      endAt: endAt && typeof endAt === 'string' ? new Date(endAt) : null,
      reminderMinutesBefore: reminder,
      recurrence: rec,
      notes: typeof notes === 'string' ? notes : '',
      reminderSentAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.schedules.id, id), eq(schema.schedules.deviceId, deviceId)),
    )
    .returning()

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { id } = await params
  const rows = await db
    .delete(schema.schedules)
    .where(
      and(eq(schema.schedules.id, id), eq(schema.schedules.deviceId, deviceId)),
    )
    .returning()

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
