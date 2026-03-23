import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'
import type { ExpoPushMessage } from 'expo-server-sdk'
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { sendPushNotifications } from '@/lib/expo-push'

export async function POST() {
  const rows = await db
    .select({
      id: schema.schedules.id,
      title: schema.schedules.title,
      notes: schema.schedules.notes,
      deviceId: schema.schedules.deviceId,
      pushToken: schema.devices.pushToken,
    })
    .from(schema.schedules)
    .innerJoin(schema.devices, eq(schema.devices.id, schema.schedules.deviceId))
    .where(
      and(
        isNotNull(schema.devices.pushToken),
        or(
          and(
            eq(schema.schedules.recurrence, 'NONE'),
            isNull(schema.schedules.reminderSentAt),
            sql`${schema.schedules.startAt} - (${schema.schedules.reminderMinutesBefore} || ' minutes')::interval <= NOW()`,
            sql`${schema.schedules.startAt} - (${schema.schedules.reminderMinutesBefore} || ' minutes')::interval > NOW() - INTERVAL '1 minute'`,
          ),
          and(
            eq(schema.schedules.recurrence, 'DAILY'),
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt} < NOW() - INTERVAL '23 hours'`,
            ),
          ),
          and(
            eq(schema.schedules.recurrence, 'WEEKLY'),
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt} < NOW() - INTERVAL '6 days 23 hours'`,
            ),
          ),
          and(
            eq(schema.schedules.recurrence, 'MONTHLY'),
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt} < NOW() - INTERVAL '27 days 23 hours'`,
            ),
          ),
        ),
      ),
    )
    .limit(100)

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const messages: ExpoPushMessage[] = rows
    .filter(
      (row): row is typeof row & { pushToken: string } => row.pushToken != null,
    )
    .map((row) => ({
      to: row.pushToken,
      title: row.title,
      body: row.notes || 'You have an upcoming schedule',
      data: { scheduleId: row.id },
    }))

  await sendPushNotifications(messages)

  const ids = rows.map((r) => r.id)
  await db
    .update(schema.schedules)
    .set({ reminderSentAt: new Date() })
    .where(inArray(schema.schedules.id, ids))

  return NextResponse.json({ sent: rows.length })
}
