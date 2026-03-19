# Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js API backend in `server/` that handles AI parsing, schedule CRUD, and push notifications.

**Architecture:** Next.js App Router API routes on Vercel Serverless. Vercel Postgres (Neon) for storage. Expo Push Service for notifications. No ORM — raw SQL via `@vercel/postgres`.

**Tech Stack:** Next.js 15, TypeScript, @vercel/postgres, ai SDK v6 (@ai-sdk/openai), Zod 4, Expo Push API (expo-server-sdk), Vitest

---

### File Structure

```
server/
├── app/api/
│   ├── devices/route.ts              # POST - register/update device
│   ├── parse/route.ts                # POST - AI parse message
│   ├── schedules/
│   │   ├── route.ts                  # GET (list), POST (create)
│   │   └── [id]/route.ts            # PUT (update), DELETE
│   └── cron/send-reminders/route.ts  # POST - cron trigger
├── lib/
│   ├── db.ts                         # Vercel Postgres connection + helpers
│   ├── ai.ts                         # AI SDK setup + parse function
│   └── expo-push.ts                  # Expo Push API wrapper
├── scripts/
│   └── migrate.ts                    # Database migration script
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.local                        # Local dev env vars
├── .env.example                      # Template
└── vitest.config.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/vercel.json`
- Create: `server/.env.example`
- Create: `server/.gitignore`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "ai-calendar-server",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "migrate": "tsx scripts/migrate.ts"
  },
  "dependencies": {
    "next": "^15.3.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@vercel/postgres": "^0.10.0",
    "ai": "^6.0.116",
    "@ai-sdk/openai": "^3.0.41",
    "zod": "^4.3.6",
    "expo-server-sdk": "^3.13.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.1.0",
    "vitest": "^3.2.1",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create server/vercel.json**

```json
{
  "framework": "nextjs"
}
```

- [ ] **Step 4: Create server/.env.example**

```
POSTGRES_URL=
AI_API_KEY=
AI_PROVIDER=openai
AI_MODEL_NAME=grok-4-1-fast-non-reasoning
AI_BASE_URL=https://yunwu.ai/v1
```

- [ ] **Step 5: Create server/.gitignore**

```
node_modules/
.next/
.env.local
```

- [ ] **Step 6: Install dependencies**

Run: `cd server && npm install`

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat(server): scaffold Next.js project"
```

---

### Task 2: Database Connection + Migration

**Files:**
- Create: `server/lib/db.ts`
- Create: `server/scripts/migrate.ts`

- [ ] **Step 1: Create server/lib/db.ts**

```ts
import { sql } from '@vercel/postgres';

export { sql };
```

- [ ] **Step 2: Create server/scripts/migrate.ts**

```ts
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
```

- [ ] **Step 3: Set up local .env.local with Vercel Postgres connection string**

Create `server/.env.local` with your `POSTGRES_URL` from Vercel dashboard.

- [ ] **Step 4: Run migration**

Run: `cd server && npx tsx scripts/migrate.ts`
Expected: "Migration complete"

- [ ] **Step 5: Commit**

```bash
git add server/lib/db.ts server/scripts/migrate.ts
git commit -m "feat(server): add database connection and migration"
```

---

### Task 3: POST /api/devices

**Files:**
- Create: `server/app/api/devices/route.ts`
- Create: `server/app/api/devices/route.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vercel/postgres', () => {
  const mockSql = Object.assign(
    vi.fn().mockResolvedValue({ rows: [] }),
    { query: vi.fn() }
  );
  return { sql: mockSql };
});

import { POST } from './route';

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/devices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if deviceId is missing', async () => {
    const res = await POST(mockRequest({ pushToken: 'token', platform: 'ios' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 on valid input', async () => {
    const res = await POST(mockRequest({
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      pushToken: 'ExponentPushToken[xxx]',
      platform: 'ios',
    }));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run app/api/devices/route.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```ts
import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { deviceId, pushToken, platform } = body;

  if (!deviceId || !pushToken || !platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await sql`
    INSERT INTO devices (id, push_token, platform)
    VALUES (${deviceId}, ${pushToken}, ${platform})
    ON CONFLICT (id) DO UPDATE SET
      push_token = ${pushToken},
      platform = ${platform},
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run app/api/devices/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/app/api/devices/
git commit -m "feat(server): add POST /api/devices endpoint"
```

---

### Task 4: AI Parse — lib/ai.ts + POST /api/parse

**Files:**
- Create: `server/lib/ai.ts`
- Create: `server/app/api/parse/route.ts`
- Create: `server/app/api/parse/route.test.ts`

- [ ] **Step 1: Create server/lib/ai.ts**

```ts
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const scheduleSchema = z.object({
  title: z.string().describe('Schedule title'),
  start_time: z.string().describe('Start time in ISO 8601 format'),
  end_time: z.optional(z.string()).describe('End time in ISO 8601 format'),
  timezone: z.optional(z.string()).describe('Timezone identifier'),
  reminder_minutes_before: z.optional(z.number()).describe('Minutes before to send reminder'),
  recurrence: z.optional(z.string()).describe('Recurrence frequency'),
  notes: z.optional(z.string()).describe('Additional notes'),
  confidence: z.optional(z.number()).describe('Confidence score between 0 and 1'),
});

export type ParsedSchedule = z.infer<typeof scheduleSchema>;

export async function parseMessage(message: string): Promise<ParsedSchedule> {
  const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || undefined,
  });

  const model = provider.chat(process.env.AI_MODEL_NAME || 'grok-4-1-fast-non-reasoning');

  const result = await generateObject({
    model,
    schema: scheduleSchema,
    prompt: `Parse the following schedule request and return structured data:\n\n"${message}"\n\nReturn the corresponding field data as required.`,
  });

  return result.object;
}
```

- [ ] **Step 2: Write the route test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ai', () => ({
  parseMessage: vi.fn(),
}));

vi.mock('@vercel/postgres', () => ({
  sql: Object.assign(vi.fn().mockResolvedValue({ rows: [{ id: 'dev-1' }] }), {}),
}));

import { POST } from './route';
import { parseMessage } from '@/lib/ai';

const mockParseMessage = vi.mocked(parseMessage);

function mockRequest(body: unknown) {
  return new Request('http://localhost/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/parse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if message is missing', async () => {
    const res = await POST(mockRequest({ deviceId: 'xxx' }));
    expect(res.status).toBe(400);
  });

  it('returns parsed schedule on success', async () => {
    mockParseMessage.mockResolvedValue({
      title: '开会',
      start_time: '2026-03-20T10:00:00+08:00',
    });

    const res = await POST(mockRequest({ message: '明天十点开会', deviceId: 'dev-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('开会');
  });

  it('returns 500 on AI failure', async () => {
    mockParseMessage.mockRejectedValue(new Error('AI error'));

    const res = await POST(mockRequest({ message: 'test', deviceId: 'dev-1' }));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && npx vitest run app/api/parse/route.test.ts`
Expected: FAIL

- [ ] **Step 4: Write route implementation**

```ts
import { NextResponse } from 'next/server';
import { parseMessage } from '@/lib/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const { message, deviceId } = body;

  if (!message || !deviceId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const parsed = await parseMessage(message);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run app/api/parse/route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/lib/ai.ts server/app/api/parse/
git commit -m "feat(server): add AI parse endpoint and lib"
```

---

### Task 5: Schedule CRUD — GET + POST /api/schedules

**Files:**
- Create: `server/app/api/schedules/route.ts`
- Create: `server/app/api/schedules/route.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSql = Object.assign(
  vi.fn().mockResolvedValue({ rows: [] }),
  { query: vi.fn() }
);
vi.mock('@vercel/postgres', () => ({ sql: mockSql }));

import { GET, POST } from './route';

function mockGetRequest(deviceId: string) {
  return new Request(`http://localhost/api/schedules?deviceId=${deviceId}`);
}

function mockPostRequest(body: unknown) {
  return new Request('http://localhost/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if deviceId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/schedules'));
    expect(res.status).toBe(400);
  });

  it('returns schedules list', async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ id: '1', title: 'test' }] });
    const res = await GET(mockGetRequest('dev-1'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});

describe('POST /api/schedules', () => {
  it('returns 400 if required fields missing', async () => {
    const res = await POST(mockPostRequest({ deviceId: 'dev-1' }));
    expect(res.status).toBe(400);
  });

  it('creates schedule and returns it', async () => {
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 'new-1', title: '开会', device_id: 'dev-1' }],
    });
    const res = await POST(mockPostRequest({
      deviceId: 'dev-1',
      title: '开会',
      startAt: '2026-03-20T10:00:00+08:00',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 30,
      recurrence: 'NONE',
      notes: '',
    }));
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run app/api/schedules/route.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run app/api/schedules/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/app/api/schedules/route.ts server/app/api/schedules/route.test.ts
git commit -m "feat(server): add GET and POST /api/schedules"
```

---

### Task 6: Schedule CRUD — PUT + DELETE /api/schedules/[id]

**Files:**
- Create: `server/app/api/schedules/[id]/route.ts`
- Create: `server/app/api/schedules/[id]/route.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSql = Object.assign(
  vi.fn().mockResolvedValue({ rows: [] }),
  { query: vi.fn() }
);
vi.mock('@vercel/postgres', () => ({ sql: mockSql }));

import { PUT, DELETE } from './route';

const params = { id: 'sched-1' };

function mockPutRequest(body: unknown) {
  return new Request('http://localhost/api/schedules/sched-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/schedules/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 if title is missing', async () => {
    const res = await PUT(mockPutRequest({ startAt: '2026-03-20T10:00:00+08:00' }), { params });
    expect(res.status).toBe(400);
  });

  it('updates and returns schedule', async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ id: 'sched-1', title: '更新' }] });
    const res = await PUT(mockPutRequest({
      title: '更新',
      startAt: '2026-03-20T10:00:00+08:00',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 15,
      recurrence: 'NONE',
      notes: '',
    }), { params });
    expect(res.status).toBe(200);
  });

  it('returns 404 if schedule not found', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });
    const res = await PUT(mockPutRequest({
      title: 'test',
      startAt: '2026-03-20T10:00:00+08:00',
    }), { params });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/schedules/[id]', () => {
  it('returns 200 on delete', async () => {
    mockSql.mockResolvedValueOnce({ rowCount: 1 });
    const res = await DELETE(
      new Request('http://localhost/api/schedules/sched-1', { method: 'DELETE' }),
      { params }
    );
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run app/api/schedules/\\[id\\]/route.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = params;
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
  const { id } = params;
  await sql`DELETE FROM schedules WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
```

Note: PUT 时将 `reminder_sent_at` 重置为 NULL，这样修改后的日程会重新触发提醒。

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run app/api/schedules/\\[id\\]/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/app/api/schedules/\\[id\\]/
git commit -m "feat(server): add PUT and DELETE /api/schedules/[id]"
```

---

### Task 7: Expo Push Lib + Cron Endpoint

**Files:**
- Create: `server/lib/expo-push.ts`
- Create: `server/app/api/cron/send-reminders/route.ts`
- Create: `server/app/api/cron/send-reminders/route.test.ts`

- [ ] **Step 1: Create server/lib/expo-push.ts**

```ts
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<void> {
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Push send error:', error);
    }
  }
}
```

- [ ] **Step 2: Write the cron route test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSql = Object.assign(
  vi.fn().mockResolvedValue({ rows: [] }),
  { query: vi.fn() }
);
vi.mock('@vercel/postgres', () => ({ sql: mockSql }));
vi.mock('@/lib/expo-push', () => ({
  sendPushNotifications: vi.fn(),
}));

import { POST } from './route';
import { sendPushNotifications } from '@/lib/expo-push';

const mockSend = vi.mocked(sendPushNotifications);

describe('POST /api/cron/send-reminders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with count 0 when no reminders due', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });
    const res = await POST();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.sent).toBe(0);
  });

  it('sends push and updates reminder_sent_at', async () => {
    mockSql
      .mockResolvedValueOnce({
        rows: [{
          id: 's1',
          title: '开会',
          notes: '准备资料',
          device_id: 'd1',
          push_token: 'ExponentPushToken[xxx]',
        }],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE

    const res = await POST();
    const data = await res.json();

    expect(mockSend).toHaveBeenCalledOnce();
    expect(data.sent).toBe(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && npx vitest run app/api/cron/send-reminders/route.test.ts`
Expected: FAIL

- [ ] **Step 4: Write cron route implementation**

```ts
import { sql } from '@/lib/db';
import { sendPushNotifications } from '@/lib/expo-push';
import { NextResponse } from 'next/server';
import type { ExpoPushMessage } from 'expo-server-sdk';

export async function POST() {
  // Find schedules due for reminder in the next 1-minute window
  // Includes: one-time (not yet sent) + recurring (last sent > 1 cycle ago)
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

  // Update reminder_sent_at for all sent schedules
  const ids = rows.map((r) => r.id);
  await sql`
    UPDATE schedules SET reminder_sent_at = NOW() WHERE id = ANY(${ids})
  `;

  return NextResponse.json({ sent: rows.length });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run app/api/cron/send-reminders/route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/lib/expo-push.ts server/app/api/cron/
git commit -m "feat(server): add push notification lib and cron endpoint"
```

---

### Task 8: Vitest Config + Full Test Run + Typecheck

**Files:**
- Create: `server/vitest.config.ts`

- [ ] **Step 1: Create server/vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 2: Run all tests**

Run: `cd server && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Run typecheck**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/vitest.config.ts
git commit -m "feat(server): add vitest config, all tests passing"
```
