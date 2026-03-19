import { sql } from '@/lib/db';
import { sendPushNotifications } from '@/lib/expo-push';
import { NextResponse } from 'next/server';
import type { ExpoPushMessage } from 'expo-server-sdk';

export async function POST() {
  const { rows } = await sql`
    SELECT s.*, d.push_token
    FROM schedules s
    JOIN devices d ON d.id = s.device_id
    WHERE d.push_token IS NOT NULL
      AND (
        (s.recurrence = 'NONE' AND s.reminder_sent_at IS NULL
          AND s.start_at - (s.reminder_minutes_before || ' minutes')::interval <= NOW()
          AND s.start_at - (s.reminder_minutes_before || ' minutes')::interval > NOW() - INTERVAL '1 minute')
        OR
        (s.recurrence = 'DAILY' AND (s.reminder_sent_at IS NULL OR s.reminder_sent_at < NOW() - INTERVAL '23 hours'))
        OR
        (s.recurrence = 'WEEKLY' AND (s.reminder_sent_at IS NULL OR s.reminder_sent_at < NOW() - INTERVAL '6 days 23 hours'))
        OR
        (s.recurrence = 'MONTHLY' AND (s.reminder_sent_at IS NULL OR s.reminder_sent_at < NOW() - INTERVAL '27 days 23 hours'))
      )
    LIMIT 100
  `;

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const messages: ExpoPushMessage[] = rows.map((row) => ({
    to: row.push_token,
    title: row.title,
    body: row.notes || 'You have an upcoming schedule',
    data: { scheduleId: row.id },
  }));

  await sendPushNotifications(messages);

  const ids = rows.map((r) => r.id as string);
  await sql`
    UPDATE schedules SET reminder_sent_at = NOW() WHERE id = ANY(${ids as unknown as string})
  `;

  return NextResponse.json({ sent: rows.length });
}
