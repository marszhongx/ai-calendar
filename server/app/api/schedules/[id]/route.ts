import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const { title, startAt, endAt, timezone, reminderMinutesBefore, recurrence, notes } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const rows = await db
    .update(schema.schedules)
    .set({
      title,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      timezone: timezone || 'Asia/Shanghai',
      reminderMinutesBefore: reminderMinutesBefore || 30,
      recurrence: recurrence || 'NONE',
      notes: notes || '',
      reminderSentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.schedules.id, id))
    .returning();

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await db.delete(schema.schedules).where(eq(schema.schedules.id, id));
  return NextResponse.json({ ok: true });
}
