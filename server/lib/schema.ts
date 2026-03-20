import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  pushToken: text('push_token').notNull(),
  platform: text('platform').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  title: text('title').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  timezone: text('timezone').notNull().default('Asia/Shanghai'),
  reminderMinutesBefore: integer('reminder_minutes_before').notNull().default(30),
  recurrence: text('recurrence').notNull().default('NONE'),
  notes: text('notes').notNull().default(''),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_schedules_device_id').on(table.deviceId),
  index('idx_schedules_reminder').on(table.startAt, table.reminderMinutesBefore, table.recurrence, table.reminderSentAt),
]);
