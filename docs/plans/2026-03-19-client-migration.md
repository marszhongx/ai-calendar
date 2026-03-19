# Client Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the client from local-only mode to server-backed mode — all AI parsing, schedule CRUD, and push registration go through the server API.

**Architecture:** Replace local services (AI SDK, AsyncStorage repository, local notifications) with a single `src/services/index.ts` API client. Device identity via UUID in AsyncStorage. Push token registration on app startup.

**Tech Stack:** Expo 55, React Native 0.83, TypeScript, AsyncStorage (device ID only), expo-notifications (push token only)

---

### File Structure Changes

**Create:**
- `src/services/index.ts` — unified API client (all server calls)

**Modify:**
- `app/_layout.tsx` — add device registration + push token upload on startup
- `app/new.tsx` — use `parseMessage()` from services instead of local AI
- `app/draft.tsx` — use `createSchedule()` from services instead of local repo + reminders
- `app/index.tsx` — use `listSchedules()` / `deleteSchedule()` from services, remove reminders
- `app/schedule/[id].tsx` — use `updateSchedule()` from services, remove reminders

**Delete:**
- `src/services/ai.ts`
- `src/services/schedule-parse.ts`
- `src/services/schedule-repository.ts`
- `src/services/schedule-reminders.ts`
- `src/config/ai-config.ts`
- `src/lib/storage.ts`
- `app/config.tsx`

---

### Task 1: Create src/services/index.ts — API Client

**Files:**
- Create: `src/services/index.ts`
- Create: `src/services/__tests__/index.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { listSchedules, createSchedule, deleteSchedule, parseMessage, registerDevice, updateSchedule } from '../index';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:3001';
});

describe('registerDevice', () => {
  it('calls POST /api/devices with correct body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    await registerDevice('dev-1', 'ExponentPushToken[xxx]', 'ios');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/devices',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ deviceId: 'dev-1', pushToken: 'ExponentPushToken[xxx]', platform: 'ios' }),
      }),
    );
  });
});

describe('parseMessage', () => {
  it('calls POST /api/parse and returns parsed data', async () => {
    const parsed = { title: '开会', start_time: '2026-03-20T10:00:00+08:00' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => parsed });
    const result = await parseMessage('明天十点开会', 'dev-1');
    expect(result).toEqual(parsed);
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'fail' }) });
    await expect(parseMessage('test', 'dev-1')).rejects.toThrow();
  });
});

describe('listSchedules', () => {
  it('calls GET /api/schedules with deviceId query param', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    await listSchedules('dev-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/schedules?deviceId=dev-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('createSchedule', () => {
  it('calls POST /api/schedules', async () => {
    const schedule = { deviceId: 'dev-1', title: '开会', startAt: '2026-03-20T10:00:00+08:00' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', ...schedule }) });
    const result = await createSchedule(schedule);
    expect(result.id).toBe('1');
  });
});

describe('updateSchedule', () => {
  it('calls PUT /api/schedules/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', title: '更新' }) });
    await updateSchedule('1', { title: '更新', startAt: '2026-03-20T10:00:00+08:00' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/schedules/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('deleteSchedule', () => {
  it('calls DELETE /api/schedules/:id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    await deleteSchedule('1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/schedules/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=src/services/__tests__/index.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```ts
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const TIMEOUT_MS = 30_000;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `Request failed: ${res.status}`, res.status);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Device registration
export function registerDevice(deviceId: string, pushToken: string, platform: string) {
  return request('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceId, pushToken, platform }),
  });
}

// AI parse
export function parseMessage(message: string, deviceId: string) {
  return request('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ message, deviceId }),
  });
}

// Schedule CRUD
export function listSchedules(deviceId: string) {
  return request(`/api/schedules?deviceId=${deviceId}`, { method: 'GET' });
}

export function createSchedule(data: Record<string, unknown>) {
  return request('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateSchedule(id: string, data: Record<string, unknown>) {
  return request(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteSchedule(id: string) {
  return request(`/api/schedules/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=src/services/__tests__/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/index.ts src/services/__tests__/index.test.ts
git commit -m "feat: add API client services/index.ts"
```

---

### Task 2: Add Device Registration + Push Token in _layout.tsx

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Write implementation**

Add device registration logic to `_layout.tsx`. On mount:
1. Read or create `deviceId` from AsyncStorage
2. Get Expo Push Token
3. Call `registerDevice()`

Replace the current content of `app/_layout.tsx` with:

```tsx
import { useEffect } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocaleProvider } from '@/context/LocaleContext'
import { registerDevice } from '@/services'
import config from '@/theme/tamagui.config'

const DEVICE_ID_KEY = 'deviceId'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function ensureDeviceRegistered() {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    if (Platform.OS === 'web') return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync();
    await registerDevice(deviceId, token.data, Platform.OS);
  } catch (error) {
    console.error('Device registration failed:', error);
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    ensureDeviceRegistered();
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <Theme name={theme}>
        <LocaleProvider>
          <Stack screenOptions={{ headerShown: true }} />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add device registration and push token upload on startup"
```

---

### Task 3: Migrate app/new.tsx to Server API

**Files:**
- Modify: `app/new.tsx`

- [ ] **Step 1: Update imports and logic**

Replace the current `app/new.tsx` content. Key changes:
- Import `parseMessage` from `@/services` instead of `@/services/schedule-parse`
- Remove `ConfigManager` import
- Remove `@/config/ai-config` import
- `defaultSubmit` calls `parseMessage(message, deviceId)` from server API
- Read `deviceId` from AsyncStorage

```tsx
import { useState } from 'react'
import { YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '@/context/LocaleContext'

import { MessageInputForm } from '@/components/message-input-form'
import { normalizeDraft } from '@/utils/schedule-normalizer'
import { parseMessage } from '@/services'
import { PENDING_DRAFT_KEY } from '@/constants'
import type { ScheduleDraft } from '@/types'
import type { ParsedSchedulePayload } from '@/types'

type NewScheduleScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
      case 'AI service unavailable':
        return t('messages.serverError')
      case 'empty_response':
        return t('messages.dataLoadFailed')
      case 'invalid_format':
        return t('messages.validationError')
      case 'timeout':
        return t('messages.timeoutError')
      default:
        return t('messages.error')
    }
  }
  return t('messages.error')
}

async function defaultSubmit(message: string) {
  const deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) throw new Error('service_unavailable');

  const data = await parseMessage(message, deviceId) as ParsedSchedulePayload;
  return normalizeDraft(data);
}

export default function NewScheduleScreen({ onSubmit = defaultSubmit }: NewScheduleScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleSubmit(message: string) {
    setError('')
    try {
      const draft = await onSubmit(message)
      await AsyncStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(draft))
      router.push('/draft')
    } catch (err) {
      setError(getErrorMessage(err, t))
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('schedule.newSchedule') }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <MessageInputForm onSubmit={handleSubmit} error={error} />
      </YStack>
    </>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add app/new.tsx
git commit -m "feat: migrate app/new.tsx to server API"
```

---

### Task 4: Migrate app/draft.tsx to Server API

**Files:**
- Modify: `app/draft.tsx`

- [ ] **Step 1: Update imports and logic**

Key changes:
- Import `createSchedule` from `@/services` instead of repository/reminders
- Remove `createScheduleRepository`, `createReminderScheduler` imports
- `createSchedule` sends data to server, server handles ID generation and notification
- Read `deviceId` from AsyncStorage

```tsx
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, Spinner, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '@/context/LocaleContext'

import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { createSchedule as apiCreateSchedule } from '@/services'
import { validateDraft } from '@/utils/schedule-validation'
import { PENDING_DRAFT_KEY, Recurrence } from '@/constants'
import type { Schedule, ScheduleDraft } from '@/types'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '',
  confidence: 0.5,
  missingFields: [],
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  submitLabel?: string
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

export default function DraftScreen({ initialDraft, submitLabel, onCreate }: DraftScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [draft, setDraft] = useState<ScheduleDraft>(initialDraft ?? fallbackDraft)
  const [loading, setLoading] = useState(!initialDraft)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialDraft) return
    AsyncStorage.getItem(PENDING_DRAFT_KEY).then((raw) => {
      if (raw) {
        setDraft(JSON.parse(raw))
        AsyncStorage.removeItem(PENDING_DRAFT_KEY)
      }
      setLoading(false)
    })
  }, [initialDraft])

  async function handleCreateSchedule(scheduleDraft: ScheduleDraft) {
    const deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) throw new Error('Device not registered');

    const result = await apiCreateSchedule({
      deviceId,
      title: scheduleDraft.title,
      startAt: scheduleDraft.startAt,
      endAt: scheduleDraft.endAt,
      timezone: scheduleDraft.timezone,
      reminderMinutesBefore: scheduleDraft.reminderMinutesBefore,
      recurrence: scheduleDraft.recurrence,
      notes: scheduleDraft.notes,
    });

    return result as unknown as Schedule;
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      const handler = onCreate ?? handleCreateSchedule
      await handler(draft)
      router.dismissAll()
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: t('schedule.saveDraft') }} />
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} disabled={submitting} submitLabel={submitLabel} />
          {submitting ? <Spinner size="large" /> : null}
        </YStack>
      </ScrollView>
    </>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add app/draft.tsx
git commit -m "feat: migrate app/draft.tsx to server API"
```

---

### Task 5: Migrate app/index.tsx to Server API

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Update imports and logic**

Key changes:
- Import `listSchedules`, `deleteSchedule` from `@/services`
- Remove `createScheduleRepository`, `createReminderScheduler` imports
- Read `deviceId` from AsyncStorage for API calls
- Remove notification cancel logic (server handles it)
- Remove config page nav button (no more client-side AI config)

```tsx
import { useCallback, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { Button, SizableText, Spinner, XStack, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import dayjs from 'dayjs'
import { useLocale } from '@/context/LocaleContext'
import { ScheduleTab } from '@/constants'

import { ScheduleList } from '@/components/schedule-list'
import { listSchedules as apiListSchedules, deleteSchedule as apiDeleteSchedule } from '@/services'
import type { Schedule } from '@/types'

function filterSchedules(schedules: Schedule[], tab: ScheduleTab): Schedule[] {
  if (tab === ScheduleTab.ALL) return schedules
  const target = tab === ScheduleTab.TODAY ? dayjs() : dayjs().add(1, 'day')
  return schedules.filter((s) => dayjs(s.startAt).isSame(target, 'day'))
}

type IndexScreenProps = {
  schedules?: Schedule[]
}

export default function IndexScreen({ schedules }: IndexScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [loading, setLoading] = useState(!schedules)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ScheduleTab>(ScheduleTab.TODAY)

  const TAB_LABELS: { key: ScheduleTab; label: string }[] = [
    { key: ScheduleTab.TODAY, label: t('schedule.tabToday') },
    { key: ScheduleTab.TOMORROW, label: t('schedule.tabTomorrow') },
    { key: ScheduleTab.ALL, label: t('schedule.tabAll') },
  ]

  const filteredItems = filterSchedules(items, activeTab)

  const emptyMessage = activeTab === ScheduleTab.TODAY
    ? t('schedule.emptyToday')
    : activeTab === ScheduleTab.TOMORROW
      ? t('schedule.emptyTomorrow')
      : undefined

  useFocusEffect(
    useCallback(() => {
      if (schedules) return

      let cancelled = false
      setLoading(true)

      AsyncStorage.getItem('deviceId').then((deviceId) => {
        if (!deviceId || cancelled) {
          setLoading(false)
          return
        }
        return apiListSchedules(deviceId) as Promise<Schedule[]>
      }).then((data) => {
        if (!cancelled && data) {
          setItems(data)
          setError('')
        }
      }).catch(() => {
        if (!cancelled) setError(t('messages.dataLoadFailed'))
      }).finally(() => {
        if (!cancelled) setLoading(false)
      })

      return () => { cancelled = true }
    }, [schedules, t])
  )

  const performDelete = useCallback(async (schedule: Schedule) => {
    try {
      await apiDeleteSchedule(schedule.id)
      setItems((prev) => prev.filter((item) => item.id !== schedule.id))
    } catch {
      if (Platform.OS === 'web') {
        window.alert(t('messages.deleteFailed'))
      } else {
        Alert.alert(t('messages.error'), t('messages.deleteFailed'))
      }
    }
  }, [t])

  const handlePress = useCallback((schedule: Schedule) => {
    router.push(`/schedule/${schedule.id}`)
  }, [router])

  const handleDelete = useCallback((schedule: Schedule) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('schedule.deleteConfirm'))) {
        performDelete(schedule)
      }
    } else {
      Alert.alert(
        t('schedule.delete'),
        t('schedule.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => performDelete(schedule),
          },
        ],
      )
    }
  }, [t, performDelete])

  return (
    <>
      <Stack.Screen
        options={{
          title: t('schedule.scheduleList'),
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <XStack
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          overflow="hidden"
          marginBottom="$3"
        >
          {TAB_LABELS.map(({ key, label }) => (
            <Button
              key={key}
              flex={1}
              size="$3"
              borderRadius={0}
              backgroundColor={activeTab === key ? '$blue10' : 'transparent'}
              onPress={() => setActiveTab(key)}
            >
              <SizableText size="$3" color={activeTab === key ? 'white' : '$color'}>
                {label}
              </SizableText>
            </Button>
          ))}
        </XStack>
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : (
          <ScheduleList schedules={filteredItems} emptyMessage={emptyMessage} onDelete={handleDelete} onPress={handlePress} />
        )}
      </YStack>
      <Button
        size="$6"
        circular
        theme="active"
        position="absolute"
        bottom={24}
        right={24}
        elevation="$4"
        onPress={() => router.push('/new')}
      >
        +
      </Button>
    </>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: migrate app/index.tsx to server API"
```

---

### Task 6: Migrate app/schedule/[id].tsx to Server API

**Files:**
- Modify: `app/schedule/[id].tsx`

- [ ] **Step 1: Update imports and logic**

Key changes:
- Import `updateSchedule` from `@/services`
- Remove `createScheduleRepository`, `createReminderScheduler` imports
- Load schedule from server via `listSchedules` + find by id (or pass via route params)
- Update calls server API directly
- No more local notification logic

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, ScrollView } from 'react-native'
import { Spinner, YStack } from 'tamagui'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '@/context/LocaleContext'

import { ScheduleDraftForm } from '@/components/schedule-draft-form'
import { listSchedules as apiListSchedules, updateSchedule as apiUpdateSchedule } from '@/services'
import { validateDraft } from '@/utils/schedule-validation'
import type { Schedule, ScheduleDraft } from '@/types'

function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return {
    title: schedule.title,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    timezone: schedule.timezone,
    reminderMinutesBefore: schedule.reminderMinutesBefore,
    recurrence: schedule.recurrence,
    notes: schedule.notes,
    confidence: 1,
    missingFields: [],
  }
}

export default function ScheduleDetailScreen() {
  const { t } = useLocale()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then(async (deviceId) => {
      if (!deviceId) {
        router.back()
        return
      }
      const schedules = await apiListSchedules(deviceId) as Schedule[]
      const found = schedules.find((s) => s.id === id)
      if (!found) {
        if (Platform.OS === 'web') {
          window.alert(t('messages.notFound'))
        } else {
          Alert.alert(t('messages.error'), t('messages.notFound'))
        }
        router.back()
        return
      }
      setSchedule(found)
      setDraft(scheduleToDraft(found))
      setLoading(false)
    })
  }, [id, router, t])

  const handleSubmit = useCallback(async () => {
    if (!draft || !schedule) return

    const result = validateDraft(draft)
    setErrors(result.errors)
    if (!result.valid) return

    setSubmitting(true)
    try {
      await apiUpdateSchedule(schedule.id, {
        title: draft.title,
        startAt: draft.startAt,
        endAt: draft.endAt,
        timezone: draft.timezone,
        reminderMinutesBefore: draft.reminderMinutesBefore,
        recurrence: draft.recurrence,
        notes: draft.notes,
      })
      router.back()
    } catch {
      setErrors([t('messages.saveFailed')])
    } finally {
      setSubmitting(false)
    }
  }, [draft, schedule, router, t])

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t('schedule.title') }} />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" />
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: draft?.title ?? t('schedule.title') }} />
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          {draft ? (
            <ScheduleDraftForm
              draft={draft}
              errors={errors}
              onChange={setDraft}
              onSubmit={handleSubmit}
              disabled={submitting}
              submitLabel={t('common.save')}
            />
          ) : null}
          {submitting ? <Spinner size="large" /> : null}
        </YStack>
      </ScrollView>
    </>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add app/schedule/[id].tsx
git commit -m "feat: migrate app/schedule/[id].tsx to server API"
```

---

### Task 7: Delete Old Files + Remove Unused Dependencies

**Files:**
- Delete: `src/services/ai.ts`
- Delete: `src/services/schedule-parse.ts`
- Delete: `src/services/schedule-repository.ts`
- Delete: `src/services/schedule-reminders.ts`
- Delete: `src/services/__tests__/schedule-parse.test.ts`
- Delete: `src/services/__tests__/schedule-repository.test.ts`
- Delete: `src/services/__tests__/schedule-reminders.test.ts`
- Delete: `src/config/ai-config.ts`
- Delete: `src/lib/storage.ts`
- Delete: `app/config.tsx`

- [ ] **Step 1: Delete old service files**

```bash
rm src/services/ai.ts
rm src/services/schedule-parse.ts
rm src/services/schedule-repository.ts
rm src/services/schedule-reminders.ts
rm src/services/__tests__/schedule-parse.test.ts
rm src/services/__tests__/schedule-repository.test.ts
rm src/services/__tests__/schedule-reminders.test.ts
rm src/config/ai-config.ts
rm src/lib/storage.ts
rm app/config.tsx
```

- [ ] **Step 2: Remove unused dependencies**

```bash
npm uninstall @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic ai zod
```

- [ ] **Step 3: Run typecheck to verify no broken imports**

Run: `npm run typecheck`
Expected: No errors (if errors appear, fix broken imports)

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: Remaining tests pass. Some old tests were deleted; new services/index.test.ts should pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old local services and unused AI SDK dependencies"
```

---

### Task 8: Update Tests for Migrated Pages

**Files:**
- Modify: `app/__tests__/input-to-draft-flow.test.tsx`
- Modify: `app/__tests__/schedule-detail.test.tsx`

These integration tests import from deleted files. They need to be updated to mock `@/services` instead.

- [ ] **Step 1: Update input-to-draft-flow.test.tsx**

Replace imports of old services with mocks of `@/services`. The test flow remains: enter message → parse → store draft → navigate to draft → confirm → save. But now "parse" and "save" go through `@/services` mocks.

- [ ] **Step 2: Update schedule-detail.test.tsx**

Replace `createScheduleRepository` import with mock of `@/services` (`listSchedules`, `updateSchedule`).

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/__tests__/
git commit -m "test: update integration tests for server API migration"
```
