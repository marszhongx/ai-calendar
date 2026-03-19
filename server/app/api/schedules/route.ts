import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  const { rows } = await sql`
    SELECT * FROM schedules WHERE device_id = ${deviceId} ORDER BY start_at ASC
  `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { deviceId, title, startAt, endAt, timezone, reminderMinutesBefore, recurrence, notes } = body;

  if (!deviceId || !title || !startAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO schedules (device_id, title, start_at, end_at, timezone, reminder_minutes_before, recurrence, notes)
    VALUES (${deviceId}, ${title}, ${startAt}, ${endAt || null}, ${timezone || 'Asia/Shanghai'}, ${reminderMinutesBefore || 30}, ${recurrence || 'NONE'}, ${notes || ''})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
