# Page Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure app so the home page is the schedule list with a FAB, and the creation flow is List → New → Draft → dismissAll back to List.

**Architecture:** Swap `index.tsx` (message input) with `schedules.tsx` (list). Extract shared constant. New page `new.tsx` takes over message input role. Use `useFocusEffect` for list refresh and `router.dismissAll()` for stack clearing.

**Tech Stack:** Expo Router 55, React Native 0.83, Tamagui 2.0-rc, `useFocusEffect` from `@react-navigation/native`

**Spec:** `docs/superpowers/specs/2026-03-18-page-restructure-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/constants.ts` | Create | Shared `PENDING_DRAFT_KEY` constant |
| `app/new.tsx` | Create | New schedule page (message input + AI parse) |
| `app/index.tsx` | Rewrite | Schedule list page (home) with FAB and settings icon |
| `app/draft.tsx` | Modify | Change navigation from `router.replace` to `router.dismissAll()`, remove residual UI, update import |
| `app/config.tsx` | Modify | Remove `SafeAreaView` wrapper, use system header |
| `app/_layout.tsx` | Modify | Set `headerShown: true` |
| `app/schedules.tsx` | Delete | Logic moved to `index.tsx` |
| `jest.setup.ts` | Modify | Add `dismissAll` mock, `Stack` mock, `useFocusEffect` mock |
| `app/__tests__/input-to-draft-flow.test.tsx` | Rewrite | Update imports, component names, assertions |

---

### Task 1: Extract shared constant

**Files:**
- Create: `src/constants.ts`

- [ ] **Step 1: Create `src/constants.ts`**

```ts
export const PENDING_DRAFT_KEY = 'pending-draft'
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.ts
git commit -m "refactor: extract PENDING_DRAFT_KEY to shared constants"
```

---

### Task 2: Create `app/new.tsx` (new schedule page)

**Files:**
- Create: `app/new.tsx`
- Reference: `app/index.tsx` (current message input logic to migrate)

- [ ] **Step 1: Create `app/new.tsx`**

Migrate all logic from current `app/index.tsx`: `getErrorMessage`, `defaultSubmit`, the component with `MessageInputForm`, error state, and `handleSubmit`. Changes from original:
- Import `PENDING_DRAFT_KEY` from `src/constants.ts` instead of defining it locally
- Export component as `NewScheduleScreen`
- Add `<Stack.Screen options={{ title: t('schedule.newSchedule') }} />` in JSX return
- Remove `SafeAreaView` wrapper
- Remove the "Schedule List" button (no longer needed, system back arrow handles navigation)

```tsx
import { useState } from 'react'
import { YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '../src/context/LocaleContext'

import { MessageInputForm } from '../src/components/message-input-form'
import { normalizeDraft } from '../src/features/schedule/normalizer'
import { parseMessageWithAI } from '../src/features/schedule/parse-message'
import { ConfigManager } from '../src/config/ai-config'
import { PENDING_DRAFT_KEY } from '../src/constants'
import type { ScheduleDraft } from '../src/types'

type NewScheduleScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
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
  const configManager = ConfigManager.getInstance()
  const aiConfig = configManager.getAIConfig()

  if (!aiConfig.apiKey) {
    throw new Error('service_unavailable')
  }

  const result = await parseMessageWithAI(message, aiConfig)

  if (!result.ok) {
    throw new Error(result.error)
  }

  return normalizeDraft(result.data)
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

- [ ] **Step 2: Commit**

```bash
git add app/new.tsx
git commit -m "feat: create new schedule page (app/new.tsx)"
```

---

### Task 3: Rewrite `app/index.tsx` as schedule list home page

**Files:**
- Rewrite: `app/index.tsx`
- Reference: `app/schedules.tsx` (current list logic to migrate)

- [ ] **Step 1: Rewrite `app/index.tsx`**

Replace entire content with schedule list logic from `schedules.tsx`. Changes from original `schedules.tsx`:
- Use `useFocusEffect` instead of `useEffect` for data loading
- Add `<Stack.Screen>` with title and `headerRight` (settings gear icon)
- Add FAB button (absolute positioned, bottom-right)
- Remove `SafeAreaView` wrapper
- Remove the "New Schedule" text button (replaced by FAB)
- Note: Empty state is already handled by `ScheduleList` component internally (shows `t('schedule.emptyList')` when `schedules.length === 0`)

```tsx
import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { Button, SizableText, Spinner, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleList } from '../src/components/schedule-list'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import type { Schedule } from '../src/types'

type IndexScreenProps = {
  schedules?: Schedule[]
}

export default function IndexScreen({ schedules }: IndexScreenProps) {
  const { t } = useLocale()
  const router = useRouter()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])
  const [loading, setLoading] = useState(!schedules)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      if (schedules) return

      let cancelled = false
      setLoading(true)
      createScheduleRepository()
        .listSchedules()
        .then((data) => {
          if (!cancelled) {
            setItems(data)
            setError('')
          }
        })
        .catch(() => {
          if (!cancelled) setError(t('messages.dataLoadFailed'))
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })

      return () => { cancelled = true }
    }, [schedules, t])
  )

  const handleDelete = useCallback((schedule: Schedule) => {
    Alert.alert(
      t('schedule.delete'),
      t('schedule.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const repository = createScheduleRepository()
              const reminders = createReminderScheduler()
              if (schedule.notificationId) {
                await reminders.cancelReminder(schedule.notificationId)
              }
              await repository.deleteSchedule(schedule.id)
              setItems((prev) => prev.filter((item) => item.id !== schedule.id))
            } catch {
              Alert.alert(t('messages.error'), t('messages.deleteFailed'))
            }
          },
        },
      ],
    )
  }, [t])

  return (
    <>
      <Stack.Screen
        options={{
          title: t('schedule.scheduleList'),
          headerRight: () => (
            <Button size="$3" chromeless onPress={() => router.push('/config')}>
              <SizableText>⚙</SizableText>
            </Button>
          ),
        }}
      />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" />
          </YStack>
        ) : error ? (
          <SizableText color="$red10">{error}</SizableText>
        ) : (
          <ScheduleList schedules={items} onDelete={handleDelete} />
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

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: rewrite index.tsx as schedule list home page with FAB"
```

---

### Task 4: Modify `app/draft.tsx`

**Files:**
- Modify: `app/draft.tsx`

- [ ] **Step 1: Rewrite `app/draft.tsx`**

Full target code:

```tsx
import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, Spinner, YStack } from 'tamagui'
import { Stack, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleDraftForm } from '../src/components/schedule-draft-form'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import { validateDraft } from '../src/features/schedule/validation'
import { PENDING_DRAFT_KEY } from '../src/constants'
import type { Schedule, ScheduleDraft } from '../src/types'

const fallbackDraft: ScheduleDraft = {
  title: '',
  startAt: new Date().toISOString(),
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: 'NONE',
  notes: '',
  confidence: 0.5,
  missingFields: [],
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

export default function DraftScreen({ initialDraft, onCreate }: DraftScreenProps) {
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

  async function createSchedule(scheduleDraft: ScheduleDraft) {
    const repository = createScheduleRepository()
    const reminders = createReminderScheduler()
    const now = new Date().toISOString()
    const scheduleBase: Schedule = {
      id: `schedule-${Date.now()}`,
      title: scheduleDraft.title,
      startAt: scheduleDraft.startAt,
      endAt: scheduleDraft.endAt,
      timezone: scheduleDraft.timezone,
      reminderMinutesBefore: scheduleDraft.reminderMinutesBefore,
      recurrence: scheduleDraft.recurrence,
      notes: scheduleDraft.notes,
      createdAt: now,
      updatedAt: now,
    }

    try {
      const notificationId = await reminders.scheduleReminder(scheduleBase, t)
      const schedule = { ...scheduleBase, notificationId }
      await repository.createSchedule(schedule)
      return schedule
    } catch (error) {
      console.error('Failed to create schedule:', error)
      throw error
    }
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors)

    if (!result.valid) {
      return
    }

    setSubmitting(true)
    try {
      const handler = onCreate ?? createSchedule
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
          <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} disabled={submitting} />
          {submitting ? (
            <Spinner size="large" />
          ) : null}
        </YStack>
      </ScrollView>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/draft.tsx
git commit -m "refactor: update draft page navigation to use dismissAll"
```

---

### Task 5: Modify `app/config.tsx`

**Files:**
- Modify: `app/config.tsx`

- [ ] **Step 1: Update `app/config.tsx`**

```tsx
import { YStack } from 'tamagui'
import { Stack } from 'expo-router'
import { useLocale } from '../src/context/LocaleContext'
import { AIConfigForm } from '../src/components/ai-config-form'

export default function ConfigScreen() {
  const { t } = useLocale()

  return (
    <>
      <Stack.Screen options={{ title: t('ai_config.title') }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <AIConfigForm />
      </YStack>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/config.tsx
git commit -m "refactor: update config page to use system header"
```

---

### Task 6: Modify `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Change `headerShown` to `true`**

Change line 15 from `headerShown: false` to `headerShown: true`.

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "refactor: enable system navigation header"
```

---

### Task 7: Delete `app/schedules.tsx`

**Files:**
- Delete: `app/schedules.tsx`

- [ ] **Step 1: Delete the file**

```bash
git rm app/schedules.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor: remove schedules.tsx (merged into index.tsx)"
```

---

### Task 8: Update test infrastructure

**Files:**
- Modify: `jest.setup.ts`

- [ ] **Step 1: Rewrite `jest.setup.ts`**

Full target code:

```ts
import '@testing-library/react-native/build/matchers/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterDismissAll = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
    dismissAll: mockRouterDismissAll,
  }),
  Stack: { Screen: () => null },
}));

(globalThis as Record<string, unknown>).__mockRouterPush = mockRouterPush;
(globalThis as Record<string, unknown>).__mockRouterDismissAll = mockRouterDismissAll;

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(cb, [cb]);
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./src/theme/tamagui.config', () => {
  const { createTamagui } = require('tamagui');
  const { config } = require('@tamagui/config/v3');
  return { __esModule: true, default: createTamagui(config) };
});
```

- [ ] **Step 2: Commit**

```bash
git add jest.setup.ts
git commit -m "test: add dismissAll, Stack, and useFocusEffect mocks"
```

---

### Task 9: Rewrite tests

**Files:**
- Rewrite: `app/__tests__/input-to-draft-flow.test.tsx`

- [ ] **Step 1: Rewrite the test file**

Full target code:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../src/theme/tamagui.config';
import { LocaleProvider } from '../../src/context/LocaleContext';

const mockRouterPush = (globalThis as Record<string, unknown>).__mockRouterPush as jest.Mock;
const mockRouterDismissAll = (globalThis as Record<string, unknown>).__mockRouterDismissAll as jest.Mock;

import ConfigScreen from '../config';
import DraftScreen from '../draft';
import NewScheduleScreen from '../new';
import IndexScreen from '../index';
import type { ScheduleDraft } from '../../src/types';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      <LocaleProvider>
        {ui}
      </LocaleProvider>
    </TamaguiProvider>
  );
}

describe('page navigation flow', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockRouterDismissAll.mockClear();
  });

  it('renders the new schedule screen with input form', () => {
    renderWithProviders(<NewScheduleScreen />);

    expect(screen.getByText('Description')).toBeOnTheScreen();
  });

  it('renders the draft screen', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: '',
          startAt: new Date().toISOString(),
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 30,
          recurrence: 'NONE',
          notes: '',
          confidence: 0.5,
          missingFields: [],
        }}
      />
    );

    expect(screen.getByText('Save Draft')).toBeOnTheScreen();
  });

  it('renders the home screen with schedule list', async () => {
    renderWithProviders(<IndexScreen schedules={[]} />);

    await waitFor(() => {
      expect(screen.getByText('No schedules yet')).toBeOnTheScreen();
    });
  });

  it('shows a fallback parse error when parsing fails with an unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('parse failed'));
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '这是一条无法解析的消息');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('这是一条无法解析的消息');
    });

    expect(screen.getByText('Operation failed')).toBeOnTheScreen();
    expect(screen.queryByText('Draft saved')).not.toBeOnTheScreen();
  });

  it('shows the service unavailable message for service_unavailable errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('service_unavailable'));
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '服务暂不可用');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Server error')).toBeOnTheScreen();
  });

  it('shows the empty response message for empty_response errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('empty_response'));
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '返回为空');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Data loading failed')).toBeOnTheScreen();
  });

  it('shows the invalid format message for invalid_format errors', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('invalid_format'));
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '格式异常');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Data validation error')).toBeOnTheScreen();
  });

  it('clears the old parse error after a successful retry and navigates to draft', async () => {
    mockRouterPush.mockClear();

    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error('parse failed'))
      .mockResolvedValueOnce({
        title: '需求评审会',
        startAt: '2026-03-17T15:00:00.000Z',
        timezone: 'Asia/Shanghai',
        reminderMinutesBefore: 30,
        recurrence: 'NONE',
        notes: '',
        confidence: 0.9,
        missingFields: [],
      } satisfies ScheduleDraft);
    renderWithProviders(<NewScheduleScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Description'), '先失败一次');
    fireEvent.press(screen.getByText('Create Schedule'));

    expect(await screen.findByText('Operation failed')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Description'), '明天下午三点开需求评审会');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenNthCalledWith(2, '明天下午三点开需求评审会');
    });

    expect(screen.queryByText('Operation failed')).not.toBeOnTheScreen();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'pending-draft',
      expect.stringContaining('需求评审会'),
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/draft');
  });

  it('shows draft validation errors when required fields are missing', () => {
    renderWithProviders(
      <DraftScreen
        initialDraft={{
          title: '',
          startAt: '',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 30,
          recurrence: 'NONE',
          notes: '',
          confidence: 0.4,
          missingFields: ['title', 'startAt'],
        }}
      />
    );

    fireEvent.press(screen.getByText('Create Schedule'));

    expect(screen.getByText('title is required')).toBeOnTheScreen();
  });

  it('calls dismissAll after creating a schedule', async () => {
    const onCreate = jest.fn().mockResolvedValue({
      id: 'schedule-1',
      title: '需求评审会',
      startAt: '2026-03-17T15:00:00.000Z',
      timezone: 'Asia/Shanghai',
      reminderMinutesBefore: 10,
      recurrence: 'WEEKLY',
      notes: '带上原型',
      notificationId: 'notification-1',
      createdAt: '2026-03-16T09:00:00.000Z',
      updatedAt: '2026-03-16T09:00:00.000Z',
    });

    renderWithProviders(
      <DraftScreen
        onCreate={onCreate}
        initialDraft={{
          title: '需求评审会',
          startAt: '2026-03-17T15:00:00.000Z',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 30,
          recurrence: 'NONE',
          notes: '',
          confidence: 0.9,
          missingFields: [],
        }}
      />
    );

    fireEvent.changeText(screen.getByLabelText('Remind me'), '10');
    fireEvent.press(screen.getByText('Weekly'));
    fireEvent.changeText(screen.getByLabelText('Description'), '带上原型');
    fireEvent.press(screen.getByText('Create Schedule'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderMinutesBefore: 10,
          recurrence: 'WEEKLY',
          notes: '带上原型',
        }),
      );
    });

    await waitFor(() => {
      expect(mockRouterDismissAll).toHaveBeenCalled();
    });
  });

  it('renders schedule card with time range when endAt exists', () => {
    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 'schedule-range',
            title: '团队会议',
            startAt: '2026-03-18T09:00:00.000Z',
            endAt: '2026-03-18T10:00:00.000Z',
            timezone: 'Asia/Shanghai',
            reminderMinutesBefore: 10,
            recurrence: 'NONE',
            notes: '',
            notificationId: 'n-1',
            createdAt: '2026-03-17T09:00:00.000Z',
            updatedAt: '2026-03-17T09:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('团队会议')).toBeOnTheScreen();
    expect(screen.getByText(/-/)).toBeOnTheScreen();
  });

  it('hides notes when schedule notes is empty', () => {
    renderWithProviders(
      <IndexScreen
        schedules={[
          {
            id: 'schedule-no-notes',
            title: '空备注日程',
            startAt: '2026-03-18T09:00:00.000Z',
            timezone: 'Asia/Shanghai',
            reminderMinutesBefore: 0,
            recurrence: 'NONE',
            notes: '',
            notificationId: 'n-2',
            createdAt: '2026-03-17T09:00:00.000Z',
            updatedAt: '2026-03-17T09:00:00.000Z',
          },
        ]}
      />
    );

    expect(screen.getByText('空备注日程')).toBeOnTheScreen();
    expect(screen.queryByTestId('schedule-notes-schedule-no-notes')).not.toBeOnTheScreen();
  });

  it('renders the config screen with provider buttons and form fields', () => {
    renderWithProviders(<ConfigScreen />);

    expect(screen.getByText('Google')).toBeOnTheScreen();
    expect(screen.getByText('OpenAI')).toBeOnTheScreen();
    expect(screen.getByText('Anthropic')).toBeOnTheScreen();
    expect(screen.getByText('Save Settings')).toBeOnTheScreen();
  });

  it('navigates to new schedule page when FAB is pressed', () => {
    renderWithProviders(<IndexScreen schedules={[]} />);

    fireEvent.press(screen.getByText('+'));

    expect(mockRouterPush).toHaveBeenCalledWith('/new');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --testPathPattern=input-to-draft-flow
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/__tests__/input-to-draft-flow.test.tsx
git commit -m "test: update tests for page restructure"
```

---

### Task 10: Run full test suite and typecheck

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Fix any issues found and commit**

---

### Task 11: Final verification

- [ ] **Step 1: Start dev server and manually verify**

```bash
npm start
```

Verify:
- Home page shows schedule list with FAB at bottom-right
- Settings gear icon in header navigates to config
- FAB navigates to new schedule page
- New page has system back arrow and message input
- Submitting message navigates to draft page
- Draft page has system back arrow
- Creating schedule returns to home page (list)
- Back button on home exits app (no stack to go back to)
- List shows newly created schedule
