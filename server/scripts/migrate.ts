import { sql } from '@vercel/postgres';

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY,
      push_token TEXT NOT NULL,
      platform TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id UUID NOT NULL REFERENCES devices(id),
      title TEXT NOT NULL,
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ,
      timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
      reminder_minutes_before INT NOT NULL DEFAULT 30,
      recurrence TEXT NOT NULL DEFAULT 'NONE',
      notes TEXT NOT NULL DEFAULT '',
      reminder_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_schedules_device_id ON schedules(device_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_schedules_reminder
    ON schedules(start_at, reminder_minutes_before, recurrence, reminder_sent_at)
  `;

  console.log('Migration complete');
}

migrate().catch(console.error);
