import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'
import type { ExpoPushMessage } from 'expo-server-sdk'
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { sendPushNotifications } from '@/lib/expo-push'

export async function POST() {
  // Step 1: Query eligible reminders
  const rows = await db
    .select({
      id: schema.schedules.id,
      title: schema.schedules.title,
      notes: schema.schedules.notes,
      deviceId: schema.schedules.deviceId,
      pushToken: schema.devices.pushToken,
      reminderSentAt: schema.schedules.reminderSentAt,
    })
    .from(schema.schedules)
    .innerJoin(schema.devices, eq(schema.devices.id, schema.schedules.deviceId))
    .where(
      and(
        isNotNull(schema.devices.pushToken),
        or(
          // Non-recurring: never sent, within 1-minute window
          and(
            eq(schema.schedules.recurrence, 'NONE'),
            isNull(schema.schedules.reminderSentAt),
            sql`${schema.schedules.startAt} - (${schema.schedules.reminderMinutesBefore} || ' minutes')::interval <= NOW()`,
            sql`${schema.schedules.startAt} - (${schema.schedules.reminderMinutesBefore} || ' minutes')::interval > NOW() - INTERVAL '1 minute'`,
          ),
          // DAILY: match time-of-day, not sent today
          and(
            eq(schema.schedules.recurrence, 'DAILY'),
            sql`EXTRACT(HOUR FROM ${schema.schedules.startAt}) * 60 + EXTRACT(MINUTE FROM ${schema.schedules.startAt}) - ${schema.schedules.reminderMinutesBefore}
              BETWEEN EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()) - 1
              AND EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW())`,
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt}::date < CURRENT_DATE`,
            ),
          ),
          // WEEKLY: match day-of-week + time-of-day, not sent this week
          and(
            eq(schema.schedules.recurrence, 'WEEKLY'),
            sql`EXTRACT(DOW FROM ${schema.schedules.startAt}) = EXTRACT(DOW FROM NOW())`,
            sql`EXTRACT(HOUR FROM ${schema.schedules.startAt}) * 60 + EXTRACT(MINUTE FROM ${schema.schedules.startAt}) - ${schema.schedules.reminderMinutesBefore}
              BETWEEN EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()) - 1
              AND EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW())`,
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt} < DATE_TRUNC('week', NOW())`,
            ),
          ),
          // MONTHLY: match day-of-month + time-of-day, not sent this month
          and(
            eq(schema.schedules.recurrence, 'MONTHLY'),
            sql`EXTRACT(DAY FROM ${schema.schedules.startAt}) = EXTRACT(DAY FROM NOW())`,
            sql`EXTRACT(HOUR FROM ${schema.schedules.startAt}) * 60 + EXTRACT(MINUTE FROM ${schema.schedules.startAt}) - ${schema.schedules.reminderMinutesBefore}
              BETWEEN EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()) - 1
              AND EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW())`,
            or(
              isNull(schema.schedules.reminderSentAt),
              sql`${schema.schedules.reminderSentAt} < DATE_TRUNC('month', NOW())`,
            ),
          ),
        ),
      ),
    )
    .limit(100)

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Step 2: Optimistic lock — claim these rows with per-row conditions
  const claimed = await db
    .update(schema.schedules)
    .set({ reminderSentAt: new Date() })
    .where(
      or(
        ...rows.map((r) =>
          and(
            eq(schema.schedules.id, r.id),
            r.reminderSentAt === null
              ? isNull(schema.schedules.reminderSentAt)
              : eq(schema.schedules.reminderSentAt, r.reminderSentAt),
          ),
        ),
      ),
    )
    .returning({ id: schema.schedules.id })

  const claimedIds = new Set(claimed.map((r) => r.id))
  const claimedRows = rows.filter((r) => claimedIds.has(r.id))

  if (claimedRows.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Step 3: Send pushes
  const messages: ExpoPushMessage[] = claimedRows.map((row) => ({
    to: row.pushToken as string,
    title: row.title,
    body: row.notes || 'You have an upcoming schedule',
    data: { scheduleId: row.id },
  }))

  const pushResult = await sendPushNotifications(messages)

  // Step 4: Reset reminderSentAt for failed pushes so they retry next run
  if (pushResult.failedTokens.length > 0) {
    const failedIds = claimedRows
      .filter((r) => pushResult.failedTokens.includes(r.pushToken as string))
      .map((r) => r.id)

    if (failedIds.length > 0) {
      await db
        .update(schema.schedules)
        .set({ reminderSentAt: null })
        .where(inArray(schema.schedules.id, failedIds))
    }
  }

  return NextResponse.json({
    sent: claimedRows.length - pushResult.failedTokens.length,
  })
}
