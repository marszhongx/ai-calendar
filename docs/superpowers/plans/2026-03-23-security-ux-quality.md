# Security, UX & Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden API security with device ownership checks, improve client UX with better validation/error handling, and clean up code quality issues across the monorepo.

**Architecture:** Server routes adopt `X-Device-Id` header for device identity. Client `request()` injects the header automatically. Cron job uses optimistic locking for atomicity. Client validation returns i18n keys, and a new ErrorBoundary wraps the app.

**Tech Stack:** Next.js 15, Drizzle ORM, Expo/React Native, Tamagui, i18n-js, Vitest (server), Jest (client)

---

### Task 1: D3 — Add `SchedulePayload` type + D1 — Unify conversions

This is a foundational task. Other tasks (D2, A1, B2) depend on the types and helpers defined here.

**Files:**
- Modify: `client/src/types/schedule.ts`
- Modify: `client/src/utils/schedule-normalizer.ts`
- Modify: `client/src/utils/__tests__/schedule-normalizer.test.ts`

- [ ] **Step 1: Add `SchedulePayload` type to `types/schedule.ts`**

After the existing `ParsedSchedulePayload` type, add:

```ts
export type SchedulePayload = {
  title: string
  startAt: string
  endAt?: string
  reminderMinutesBefore: number
  recurrence: Recurrence
  notes: string
  originalMessage?: string
}
```

- [ ] **Step 2: Add `scheduleToDraft` and `draftToPayload` to `schedule-normalizer.ts`**

Add these two functions after the existing `normalizeDraft`:

```ts
import type { ParsedSchedulePayload, Schedule, ScheduleDraft, SchedulePayload } from '../types'

export function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return {
    title: schedule.title,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    reminderMinutesBefore: schedule.reminderMinutesBefore,
    recurrence: schedule.recurrence,
    notes: schedule.notes,
    originalMessage: schedule.originalMessage,
    confidence: 1,
    missingFields: [],
  }
}

export function draftToPayload(draft: ScheduleDraft): SchedulePayload {
  return {
    title: draft.title,
    startAt: draft.startAt,
    endAt: draft.endAt,
    reminderMinutesBefore: draft.reminderMinutesBefore,
    recurrence: draft.recurrence,
    notes: draft.notes,
    originalMessage: draft.originalMessage,
  }
}
```

- [ ] **Step 3: Add tests for the new functions**

In `schedule-normalizer.test.ts`, add:

```ts
import { Recurrence } from '../../constants'
import type { Schedule, ScheduleDraft } from '../../types'
import { draftToPayload, scheduleToDraft } from '../schedule-normalizer'

describe('scheduleToDraft', () => {
  it('converts a Schedule to ScheduleDraft', () => {
    const schedule: Schedule = {
      id: 'sched-1',
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    }
    const draft = scheduleToDraft(schedule)
    expect(draft).toEqual({
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      confidence: 1,
      missingFields: [],
    })
  })
})

describe('draftToPayload', () => {
  it('converts a ScheduleDraft to SchedulePayload', () => {
    const draft: ScheduleDraft = {
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: Recurrence.WEEKLY,
      notes: '带资料',
      originalMessage: '每周三开会',
      confidence: 0.9,
      missingFields: [],
    }
    const payload = draftToPayload(draft)
    expect(payload).toEqual({
      title: '开会',
      startAt: '2026-03-20T10:00:00Z',
      endAt: '2026-03-20T11:00:00Z',
      reminderMinutesBefore: 15,
      recurrence: 'WEEKLY',
      notes: '带资料',
      originalMessage: '每周三开会',
    })
    // Should not include confidence or missingFields
    expect(payload).not.toHaveProperty('confidence')
    expect(payload).not.toHaveProperty('missingFields')
  })
})
```

- [ ] **Step 4: Run tests**

Run: `cd client && npm test -- --testPathPattern=schedule-normalizer`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/types/schedule.ts client/src/utils/schedule-normalizer.ts client/src/utils/__tests__/schedule-normalizer.test.ts
git commit -m "feat: add SchedulePayload type, scheduleToDraft and draftToPayload helpers"
```

---

### Task 2: A1 — X-Device-Id header (client side) + D2 — Strong-typed services

**Files:**
- Modify: `client/src/services/index.ts`
- Modify: `client/src/services/__tests__/index.test.ts`
- Modify: `client/app/_layout.tsx` (pass deviceId to registerDevice differently)
- Modify: `client/app/new.tsx` (remove deviceId from parseMessage body)
- Modify: `client/app/draft.tsx` (use draftToPayload, remove manual object)
- Modify: `client/app/schedule/[id].tsx` (use scheduleToDraft/draftToPayload imports, remove local copy)
- Modify: `client/app/index.tsx` (remove `as Schedule[]` cast)
- Modify: `client/src/hooks/useDeviceId.ts`

- [ ] **Step 1: Add deviceId module-level cache and inject X-Device-Id header in `services/index.ts`**

```ts
import type { Schedule, SchedulePayload } from '../types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4399'
const TIMEOUT_MS = 30_000
const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

let _deviceId: string | null = null

export function setDeviceId(id: string) {
  _deviceId = id
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (_deviceId) {
    headers['X-Device-Id'] = _deviceId
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(
        body.error || `Request failed: ${res.status}`,
        res.status,
      )
    }

    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export function registerDevice(pushToken: string | null, platform: string) {
  return request('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ pushToken, platform }),
  })
}

export function parseMessage(message: string) {
  return request('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ message, timezone: DEVICE_TIMEZONE }),
  })
}

export function listSchedules() {
  return request<Schedule[]>('/api/schedules', { method: 'GET' })
}

export function createSchedule(data: SchedulePayload) {
  return request<Schedule>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSchedule(id: string, data: Omit<SchedulePayload, 'originalMessage'>) {
  return request<Schedule>(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteSchedule(id: string) {
  return request(`/api/schedules/${id}`, { method: 'DELETE' })
}
```

Key changes:
- `setDeviceId()` exported, called once at startup
- `registerDevice` no longer takes `deviceId` param
- `parseMessage` no longer takes `deviceId` param
- `listSchedules` no longer takes `deviceId` param, no query string
- `createSchedule` takes `SchedulePayload` instead of `Record<string, unknown>`
- `updateSchedule` takes `Omit<SchedulePayload, 'originalMessage'>` instead of `Record<string, unknown>`
- All typed with generics

- [ ] **Step 2: Update `_layout.tsx` to call `setDeviceId`**

In `ensureDeviceRegistered()`, after determining `deviceId` and storing it in AsyncStorage, call `setDeviceId(deviceId)` before calling `registerDevice`. Update `registerDevice` call to remove `deviceId` param:

```ts
import { registerDevice, setDeviceId } from '@/services'

// Inside ensureDeviceRegistered, after AsyncStorage.setItem:
setDeviceId(deviceId)

// Change all registerDevice calls from:
await registerDevice(deviceId, token.data, Platform.OS)
// To:
await registerDevice(token.data, Platform.OS)
```

- [ ] **Step 3: Update `useDeviceId` hook to also call `setDeviceId`**

```ts
import { setDeviceId as setApiDeviceId } from '../services'

// In the useEffect, after getting id from AsyncStorage:
AsyncStorage.getItem(DEVICE_ID_KEY).then((id) => {
  setDeviceId(id)
  if (id) setApiDeviceId(id)
  setLoading(false)
})
```

- [ ] **Step 4: Update `new.tsx`**

Remove `deviceId` from `parseMessage` call. Remove `AsyncStorage` import and `DEVICE_ID_KEY` import (now unused):

```ts
// Remove these imports:
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { DEVICE_ID_KEY, ... } from '@/constants'  (keep other imports from constants)

async function defaultSubmit(message: string) {
  const data = (await parseMessage(message)) as ParsedSchedulePayload
  return normalizeDraft(data, message)
}
```

- [ ] **Step 5: Update `draft.tsx`**

Use `draftToPayload` and remove manual object construction. Remove `deviceId` from `createSchedule`:

```ts
import { draftToPayload } from '@/utils/schedule-normalizer'

async function handleCreateSchedule(scheduleDraft: ScheduleDraft) {
  return createSchedule(draftToPayload(scheduleDraft))
}
```

Remove the `AsyncStorage.getItem(DEVICE_ID_KEY)` call and the `DEVICE_ID_KEY` import.

- [ ] **Step 6: Update `schedule/[id].tsx`**

Import `scheduleToDraft` and `draftToPayload` from normalizer. Remove local `scheduleToDraft`. Use `draftToPayload` in submit:

```ts
import { draftToPayload, scheduleToDraft } from '@/utils/schedule-normalizer'

// In handleSubmit:
const { originalMessage, ...payload } = draftToPayload(draft)
await apiUpdateSchedule(id, payload)
```

Remove `deviceId` from `apiListSchedules` call:

```ts
apiListSchedules()
  .then((schedules) => {
    if (cancelled) return
    const found = schedules.find((s) => s.id === id)
    // ...
  })
```

- [ ] **Step 7: Update `index.tsx`**

Remove `deviceId` dependency and `as Schedule[]` cast:

```ts
apiListSchedules()
  .then((data) => {
    if (!cancelled && data) {
      setItems(data)
      setError('')
    }
  })
```

Remove `useDeviceId` hook usage and `deviceId` from useFocusEffect dependencies if it was only used for the API call. Keep `useDeviceId` import if needed for other purposes, otherwise remove.

- [ ] **Step 8: Update `services/__tests__/index.test.ts`**

Update all test expectations to match new signatures:
- `registerDevice` called with 2 params (no deviceId)
- `parseMessage` called with 1 param (no deviceId)
- `listSchedules` called with no params, URL has no query string
- All requests should include `X-Device-Id` header

```ts
import { setDeviceId } from '../index'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:4399'
  setDeviceId('dev-1')
})

// Update registerDevice test:
await registerDevice('ExponentPushToken[xxx]', 'ios')
expect(mockFetch).toHaveBeenCalledWith(
  'http://localhost:4399/api/devices',
  expect.objectContaining({
    method: 'POST',
    headers: expect.objectContaining({ 'X-Device-Id': 'dev-1' }),
    body: JSON.stringify({
      pushToken: 'ExponentPushToken[xxx]',
      platform: 'ios',
    }),
  }),
)

// Update parseMessage test:
await parseMessage('明天十点开会')
// No deviceId in body

// Update listSchedules test:
await listSchedules()
expect(mockFetch).toHaveBeenCalledWith(
  'http://localhost:4399/api/schedules',
  expect.objectContaining({ method: 'GET' }),
)
```

- [ ] **Step 9: Run client tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 10: Commit**

```bash
git add client/
git commit -m "feat: unify X-Device-Id header, strong-type API services, use shared conversion helpers"
```

---

### Task 3: A1 — X-Device-Id header (server side) + A2 — Input validation

**Files:**
- Create: `server/lib/device-id.ts`
- Modify: `server/app/api/devices/route.ts`
- Modify: `server/app/api/parse/route.ts`
- Modify: `server/app/api/schedules/route.ts`
- Modify: `server/app/api/schedules/[id]/route.ts`
- Modify: `server/app/api/devices/route.test.ts`
- Modify: `server/app/api/parse/route.test.ts`
- Modify: `server/app/api/schedules/route.test.ts`
- Modify: `server/app/api/schedules/[id]/route.test.ts`

- [ ] **Step 1: Create `server/lib/device-id.ts`**

```ts
import { NextResponse } from 'next/server'

export function getDeviceId(request: Request): string | null {
  return request.headers.get('x-device-id')
}

export function requireDeviceId(request: Request) {
  const deviceId = getDeviceId(request)
  if (!deviceId) {
    return { deviceId: null, error: NextResponse.json({ error: 'Missing X-Device-Id header' }, { status: 401 }) }
  }
  return { deviceId, error: null }
}
```

- [ ] **Step 2: Create `server/lib/validate.ts` — safe JSON parse helper**

```ts
import { NextResponse } from 'next/server'

export async function parseJsonBody<T = unknown>(request: Request): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const data = await request.json()
    return { data: data as T, error: null }
  } catch {
    return { data: null, error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
}

const VALID_RECURRENCES = new Set(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])

export function isValidRecurrence(value: string): boolean {
  return VALID_RECURRENCES.has(value)
}

export function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}
```

- [ ] **Step 3: Update `devices/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireDeviceId } from '@/lib/device-id'
import { parseJsonBody } from '@/lib/validate'

export async function POST(request: Request) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { pushToken, platform } = body as { pushToken?: string; platform?: string }

  if (!platform) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await db
    .insert(schema.devices)
    .values({ id: deviceId, pushToken: pushToken ?? null, platform })
    .onConflictDoUpdate({
      target: schema.devices.id,
      set: { pushToken: pushToken ?? null, platform, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Update `parse/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { parseMessage } from '@/lib/ai'
import { requireDeviceId } from '@/lib/device-id'
import { parseJsonBody } from '@/lib/validate'

export async function POST(request: Request) {
  const { error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { message, timezone } = body as { message?: string; timezone?: string }

  if (!message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  try {
    const parsed = await parseMessage(message, timezone)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI parse error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Update `schedules/route.ts` — GET uses header, POST validates inputs**

```ts
import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireDeviceId } from '@/lib/device-id'
import { isValidDate, isValidRecurrence, parseJsonBody } from '@/lib/validate'

export async function GET(request: Request) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const rows = await db
    .select()
    .from(schema.schedules)
    .where(eq(schema.schedules.deviceId, deviceId))
    .orderBy(asc(schema.schedules.startAt))

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const { deviceId, error: authError } = requireDeviceId(request)
  if (authError) return authError

  const { data: body, error: parseError } = await parseJsonBody(request)
  if (parseError) return parseError

  const { title, startAt, endAt, reminderMinutesBefore, recurrence, notes, originalMessage } =
    body as Record<string, unknown>

  if (!title || typeof title !== 'string' || !startAt || typeof startAt !== 'string') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 })
    }
  }

  const reminder = typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : 30
  if (!Number.isInteger(reminder) || reminder < 0 || reminder > 1440) {
    return NextResponse.json({ error: 'reminderMinutesBefore must be 0-1440' }, { status: 400 })
  }

  const rec = typeof recurrence === 'string' ? recurrence : 'NONE'
  if (!isValidRecurrence(rec)) {
    return NextResponse.json({ error: 'Invalid recurrence value' }, { status: 400 })
  }

  const rows = await db
    .insert(schema.schedules)
    .values({
      deviceId,
      title,
      startAt: new Date(startAt),
      endAt: endAt && typeof endAt === 'string' ? new Date(endAt) : null,
      reminderMinutesBefore: reminder,
      recurrence: rec,
      notes: typeof notes === 'string' ? notes : '',
      originalMessage: typeof originalMessage === 'string' ? originalMessage : '',
    })
    .returning()

  return NextResponse.json(rows[0], { status: 201 })
}
```

- [ ] **Step 6: Update `schedules/[id]/route.ts` — ownership check + validation**

```ts
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

  if (!title || typeof title !== 'string' || !startAt || typeof startAt !== 'string') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
      return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 })
    }
  }

  const reminder = typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : 30
  if (!Number.isInteger(reminder) || reminder < 0 || reminder > 1440) {
    return NextResponse.json({ error: 'reminderMinutesBefore must be 0-1440' }, { status: 400 })
  }

  const rec = typeof recurrence === 'string' ? recurrence : 'NONE'
  if (!isValidRecurrence(rec)) {
    return NextResponse.json({ error: 'Invalid recurrence value' }, { status: 400 })
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
    .where(and(eq(schema.schedules.id, id), eq(schema.schedules.deviceId, deviceId)))
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
    .where(and(eq(schema.schedules.id, id), eq(schema.schedules.deviceId, deviceId)))
    .returning()

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Update server tests**

All test helper functions need to add `X-Device-Id` header. Update `mockRequest` / `mockGetRequest` / `mockPutRequest` in all 4 test files.

Example for `devices/route.test.ts`:
```ts
function mockRequest(body: unknown, deviceId = '550e8400-e29b-41d4-a716-446655440000') {
  return new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
    body: JSON.stringify(body),
  })
}

it('returns 401 if X-Device-Id header missing', async () => {
  const res = await POST(new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: 'ios' }),
  }))
  expect(res.status).toBe(401)
})

it('returns 400 if body is invalid JSON', async () => {
  const res = await POST(new Request('http://localhost/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': 'dev-1' },
    body: '{invalid',
  }))
  expect(res.status).toBe(400)
})
```

Similar changes for `schedules/route.test.ts` (remove `deviceId` from body, add header), `schedules/[id]/route.test.ts` (add header, add ownership test), and `parse/route.test.ts`.

For `[id]/route.test.ts`, add ownership check test:
```ts
it('returns 404 when deviceId does not own the schedule', async () => {
  // The update query filters by both id AND deviceId.
  // If deviceId doesn't match, returning() returns empty array → 404
  mockReturning.mockResolvedValueOnce([])
  const res = await PUT(
    mockPutRequest({ title: 'test', startAt: '2026-03-20T10:00:00+08:00' }, 'wrong-device'),
    { params },
  )
  expect(res.status).toBe(404)
})
```

- [ ] **Step 8: Run server tests**

Run: `npm run test:server`
Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
git add server/
git commit -m "feat: add X-Device-Id auth, ownership checks, input validation on all routes"
```

---

### Task 4: A3 — Cron race condition fix + A5 — Push failure retry

**Files:**
- Modify: `server/lib/expo-push.ts`
- Modify: `server/app/api/cron/send-reminders/route.ts`
- Modify: `server/app/api/cron/send-reminders/route.test.ts`

- [ ] **Step 1: Update `expo-push.ts` to return success/failure**

```ts
import { Expo, type ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

export type PushResult = {
  succeededTokens: string[]
  failedTokens: string[]
}

export async function sendPushNotifications(
  messages: ExpoPushMessage[],
): Promise<PushResult> {
  const succeededTokens: string[] = []
  const failedTokens: string[] = []

  const chunks = expo.chunkPushNotifications(messages)
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  )

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const result = results[i]
    if (result.status === 'rejected') {
      console.error('Push send error:', result.reason)
      for (const msg of chunk) {
        const token = Array.isArray(msg.to) ? msg.to[0] : msg.to
        if (token) failedTokens.push(token)
      }
    } else {
      for (const msg of chunk) {
        const token = Array.isArray(msg.to) ? msg.to[0] : msg.to
        if (token) succeededTokens.push(token)
      }
    }
  }

  return { succeededTokens, failedTokens }
}
```

- [ ] **Step 2: Update cron route — optimistic lock + selective update**

```ts
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

  // Step 2: Optimistic lock — claim these rows
  const ids = rows.map((r) => r.id)
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

  return NextResponse.json({ sent: claimedRows.length - (pushResult.failedTokens.length) })
}
```

- [ ] **Step 3: Update cron test**

Update mock to match new `sendPushNotifications` return type:

```ts
const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ succeededTokens: [], failedTokens: [] }))

// In the "sends push" test:
mockSend.mockResolvedValueOnce({ succeededTokens: ['ExponentPushToken[xxx]'], failedTokens: [] })
```

Add the `reminderSentAt` field to the mock select result and update mock chain to support the new `.returning()` call on the optimistic lock update.

- [ ] **Step 4: Run server tests**

Run: `npm run test:server`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "fix: cron race condition with optimistic lock, retry failed pushes, fix recurring drift"
```

---

### Task 5: B2 — Localized validation + B4 — Reminder constraint

**Files:**
- Modify: `client/src/utils/schedule-validation.ts`
- Modify: `client/src/utils/__tests__/schedule-validation.test.ts`
- Modify: `client/src/i18n/locales/zh.json`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/zh-TW.json`
- Modify: `client/src/i18n/types.ts` (add `validation` section to TranslationKeys)
- Modify: `client/app/draft.tsx` (translate errors)
- Modify: `client/app/schedule/[id].tsx` (translate errors)

- [ ] **Step 1: Update `schedule-validation.ts` — return i18n keys, add reminder range check**

```ts
import { Recurrence } from '../constants'
import type { Schedule, ScheduleDraft, ValidationResult } from '../types'

function isAllowedRecurrence(value: string) {
  return Object.values(Recurrence).includes(value as Recurrence)
}

export function validateDraft(draft: ScheduleDraft): ValidationResult {
  const errors: string[] = []

  if (!draft.title.trim()) {
    errors.push('validation.titleRequired')
  }

  if (!draft.startAt.trim()) {
    errors.push('validation.startAtRequired')
  }

  if (!isAllowedRecurrence(draft.recurrence)) {
    errors.push('validation.invalidRecurrence')
  }

  if (
    !Number.isInteger(draft.reminderMinutesBefore) ||
    draft.reminderMinutesBefore < 0 ||
    draft.reminderMinutesBefore > 1440
  ) {
    errors.push('validation.reminderRange')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateSchedule(schedule: Schedule): ValidationResult {
  const errors: string[] = []

  if (!schedule.id.trim()) {
    errors.push('id is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

- [ ] **Step 2: Add translations to all 3 locale files**

In `zh.json`, add inside the root object (as a new `"validation"` section):
```json
"validation": {
  "titleRequired": "请输入事件名称",
  "startAtRequired": "请选择开始时间",
  "invalidRecurrence": "重复方式无效",
  "reminderRange": "提醒时间需在 0-1440 分钟之间",
  "lowConfidence": "AI 解析置信度较低，请仔细核对各字段"
}
```

In `en.json`:
```json
"validation": {
  "titleRequired": "Event name is required",
  "startAtRequired": "Start time is required",
  "invalidRecurrence": "Invalid repeat option",
  "reminderRange": "Reminder must be between 0 and 1440 minutes",
  "lowConfidence": "AI parsing confidence is low, please review all fields"
}
```

In `zh-TW.json`:
```json
"validation": {
  "titleRequired": "請輸入活動名稱",
  "startAtRequired": "請選擇開始時間",
  "invalidRecurrence": "重複方式無效",
  "reminderRange": "提醒時間需在 0-1440 分鐘之間",
  "lowConfidence": "AI 解析置信度較低，請仔細核對各欄位"
}
```

- [ ] **Step 3: Add `validation` section to `client/src/i18n/types.ts`**

Add after the `messages` section in the `TranslationKeys` interface:

```ts
validation: {
  titleRequired: string
  startAtRequired: string
  invalidRecurrence: string
  reminderRange: string
  lowConfidence: string
}
```

- [ ] **Step 4: Update error display in `draft.tsx` and `schedule/[id].tsx`**

Both files display validation errors. After calling `validateDraft`, translate the error keys:

```ts
const result = validateDraft(draft)
setErrors(result.errors.map((key) => t(key)))
```

- [ ] **Step 5: Update validation tests**

Update expected error strings to i18n keys:

```ts
// 'title is required' → 'validation.titleRequired'
// 'startAt is required' → 'validation.startAtRequired'
// 'recurrence must be one of NONE, DAILY, WEEKLY, MONTHLY' → 'validation.invalidRecurrence'

it('rejects reminder out of range', () => {
  const draft: ScheduleDraft = {
    title: '开会',
    startAt: '2026-03-17T15:00:00.000Z',
    reminderMinutesBefore: -5,
    recurrence: Recurrence.NONE,
    notes: '',
    originalMessage: '',
    confidence: 0.8,
    missingFields: [],
  }
  expect(validateDraft(draft)).toEqual({
    valid: false,
    errors: ['validation.reminderRange'],
  })
})

it('rejects reminder over 1440', () => {
  const draft: ScheduleDraft = {
    title: '开会',
    startAt: '2026-03-17T15:00:00.000Z',
    reminderMinutesBefore: 1500,
    recurrence: Recurrence.NONE,
    notes: '',
    originalMessage: '',
    confidence: 0.8,
    missingFields: [],
  }
  expect(validateDraft(draft)).toEqual({
    valid: false,
    errors: ['validation.reminderRange'],
  })
})
```

- [ ] **Step 6: Run client tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add client/
git commit -m "feat: localized validation errors, reminder minutes 0-1440 constraint"
```

---

### Task 6: B1 — End time picker + B3 — Retry button + B5 — Low confidence warning

**Files:**
- Modify: `client/src/components/schedule-draft-form.tsx`
- Modify: `client/app/index.tsx`
- Modify: `client/app/draft.tsx`

- [ ] **Step 1: Add endAt picker to `schedule-draft-form.tsx`**

In the "Start / End Time" `FormSection`, after the startAt `DateTimePickerField`, add:

```tsx
<SizableText
  size="$3"
  color={LABEL_COLOR}
  fontWeight="500"
  marginTop="$2"
>
  {t('schedule.endTime')}
</SizableText>
<DateTimePickerField
  value={draft.endAt ?? ''}
  onChange={(endAt) => onChange({ ...draft, endAt: endAt || undefined })}
  disabled={disabled}
  locale={locale}
/>
```

- [ ] **Step 2: Clamp reminder minutes in `schedule-draft-form.tsx`**

Update the reminder `onChangeText` handler to clamp:

```tsx
onChangeText={(value) => {
  const num = Number(value)
  onChange({
    ...draft,
    reminderMinutesBefore: Number.isNaN(num)
      ? 0
      : Math.max(0, Math.min(1440, Math.trunc(num))),
  })
}}
```

- [ ] **Step 3: Add retry button to `index.tsx`**

Extract the fetch logic into a `fetchSchedules` function to avoid duplicating it between `useFocusEffect` and the retry button:

```tsx
const fetchSchedules = useCallback(() => {
  setLoading(true)
  setError('')
  apiListSchedules()
    .then((data) => {
      if (data) setItems(data)
    })
    .catch(() => setError(t('messages.dataLoadFailed')))
    .finally(() => setLoading(false))
}, [t])

useFocusEffect(
  useCallback(() => {
    if (schedules) return
    fetchSchedules()
  }, [schedules, fetchSchedules]),
)
```

Replace the error display section:

```tsx
// Before:
<SizableText color="$red10">{error}</SizableText>

// After:
<YStack alignItems="center" gap="$3" paddingVertical="$6">
  <SizableText color="$red10">{error}</SizableText>
  <PillButton selected={false} onPress={fetchSchedules}>
    {t('messages.retry')}
  </PillButton>
</YStack>
```

- [ ] **Step 4: Add low confidence banner to `draft.tsx`**

After the `<ScheduleDraftForm>` opening and before `{draft.originalMessage ? ...}`, or more precisely: in `draft.tsx` before `<ScheduleDraftForm`, add:

```tsx
{draft.confidence < 0.6 && (
  <ErrorBanner message={t('validation.lowConfidence')} />
)}
```

Import `ErrorBanner`:
```ts
import { ErrorBanner } from '@/components/error-banner'
```

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add client/
git commit -m "feat: end time picker, retry button on load failure, low confidence warning"
```

---

### Task 7: D4 — Error Boundary

**Files:**
- Create: `client/src/components/error-boundary.tsx`
- Modify: `client/app/_layout.tsx`

Note: ErrorBoundary uses hardcoded English strings because class components cannot use the `useLocale` hook. This is an acceptable trade-off since the error boundary is a last-resort fallback.

- [ ] **Step 1: Create `error-boundary.tsx`**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SizableText, YStack } from 'tamagui'
import { AccentButton } from './accent-button'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$4">
          <SizableText size="$8">:(</SizableText>
          <SizableText size="$4" textAlign="center" color="$color11">
            Something went wrong
          </SizableText>
          <AccentButton
            label="Retry"
            onPress={() => this.setState({ hasError: false })}
          />
        </YStack>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 2: Wrap app in `_layout.tsx`**

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

// In the return, wrap the entire tree:
return (
  <ErrorBoundary>
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>
        <LocaleProvider>
          <Stack ... />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  </ErrorBoundary>
)
```

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add client/src/components/error-boundary.tsx client/app/_layout.tsx
git commit -m "feat: add ErrorBoundary at app root"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run all tests**

Run: `npm run test:all`
Expected: All tests pass

- [ ] **Step 2: Run typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: No errors

- [ ] **Step 3: Final commit if any fixes needed**
