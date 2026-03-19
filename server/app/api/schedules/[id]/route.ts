import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();
  const { title, startAt, endAt, timezone, reminderMinutesBefore, recurrence, notes } = body;

  if (!title || !startAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { rows } = await sql`
    UPDATE schedules SET
      title = ${title},
      start_at = ${startAt},
      end_at = ${endAt || null},
      timezone = ${timezone || 'Asia/Shanghai'},
      reminder_minutes_before = ${reminderMinutesBefore || 30},
      recurrence = ${recurrence || 'NONE'},
      notes = ${notes || ''},
      reminder_sent_at = NULL,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await sql`DELETE FROM schedules WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
