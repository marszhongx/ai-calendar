# Schedule Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to tap a schedule card to view and edit its details, reusing the existing ScheduleDraftForm component.

**Architecture:** New dynamic route `app/schedule/[id].tsx` loads a Schedule by ID, converts it to ScheduleDraft, renders ScheduleDraftForm with a "Save" button. ScheduleList gains an `onPress` callback to navigate to the detail page.

**Tech Stack:** Expo Router, Tamagui, React Native, AsyncStorage, Jest + Testing Library

**Spec:** `docs/superpowers/specs/2026-03-19-schedule-detail-design.md`

---

### Task 1: Add `getScheduleById` to repository

**Files:**
- Modify: `src/features/schedule/repository.ts:22-46`
- Test: `src/features/schedule/__tests__/repository.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/features/schedule/__tests__/repository.test.ts`, add:

```typescript
it('gets a schedule by id', async () => {
  const repository = createScheduleRepository();
  await repository.createSchedule(baseSchedule);

  await expect(repository.getScheduleById('schedule-1')).resolves.toEqual(baseSchedule);
});

it('returns undefined for non-existent schedule id', async () => {
  const repository = createScheduleRepository();

  await expect(repository.getScheduleById('non-existent')).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=repository.test`
Expected: FAIL — `repository.getScheduleById is not a function`

- [ ] **Step 3: Implement `getScheduleById`**

In `src/features/schedule/repository.ts`, add inside the returned object (after `listSchedules`):

```typescript
async getScheduleById(id: string) {
  const schedules = await readSchedules(storage);
  return schedules.find((item) => item.id === id);
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=repository.test`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/schedule/repository.ts src/features/schedule/__tests__/repository.test.ts
git commit -m "feat(schedule): add getScheduleById to repository"
```

---

### Task 2: Add `submitLabel` prop to ScheduleDraftForm

**Files:**
- Modify: `src/components/schedule-draft-form.tsx:7-13,110-117`
- Test: `app/__tests__/input-to-draft-flow.test.tsx`

- [ ] **Step 1: Write the failing test**

In `app/__tests__/input-to-draft-flow.test.tsx`, add:

```typescript
it('renders custom submit label when submitLabel prop is provided', () => {
  renderWithProviders(
    <DraftScreen
      initialDraft={{
        title: 'Test',
        startAt: new Date().toISOString(),
        timezone: 'Asia/Shanghai',
        reminderMinutesBefore: 30,
        recurrence: Recurrence.NONE,
        notes: '',
        confidence: 0.9,
        missingFields: [],
      }}
      submitLabel="Save"
    />
  );

  expect(screen.getByText('Save')).toBeOnTheScreen();
  expect(screen.queryByText('Create Schedule')).not.toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: FAIL — `submitLabel` prop not recognized / button still shows "Create Schedule"

- [ ] **Step 3: Add `submitLabel` prop to ScheduleDraftForm**

In `src/components/schedule-draft-form.tsx`:

Update the props type:

```typescript
type ScheduleDraftFormProps = {
  draft: ScheduleDraft
  errors: string[]
  disabled?: boolean
  submitLabel?: string
  onChange(draft: ScheduleDraft): void
  onSubmit(): void
}
```

Update the component destructuring:

```typescript
export function ScheduleDraftForm({ draft, errors, disabled, submitLabel, onChange, onSubmit }: ScheduleDraftFormProps) {
```

Update the button text (line 116):

```typescript
{submitLabel ?? t('schedule.create')}
```

- [ ] **Step 4: Thread `submitLabel` through DraftScreen**

In `app/draft.tsx`:

Update the props type:

```typescript
type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  submitLabel?: string
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}
```

Update the component destructuring:

```typescript
export default function DraftScreen({ initialDraft, submitLabel, onCreate }: DraftScreenProps) {
```

Pass `submitLabel` to ScheduleDraftForm (line 114):

```typescript
<ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} disabled={submitting} submitLabel={submitLabel} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/schedule-draft-form.tsx app/draft.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat(schedule): add submitLabel prop to ScheduleDraftForm"
```

---

### Task 3: Make ScheduleList cards tappable

**Files:**
- Modify: `src/components/schedule-list.tsx:7-11,47-74`
- Test: `app/__tests__/input-to-draft-flow.test.tsx`

- [ ] **Step 1: Write the failing test**

In `app/__tests__/input-to-draft-flow.test.tsx`, add:

```typescript
it('calls onPress when a schedule card is tapped', () => {
  const onPress = jest.fn();
  const now = dayjs().hour(12).minute(0).second(0).toISOString();
  const schedule = {
    id: 's-tap',
    title: '可点击日程',
    startAt: now,
    timezone: 'Asia/Shanghai',
    reminderMinutesBefore: 10,
    recurrence: Recurrence.NONE,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  renderWithProviders(
    <ScheduleList schedules={[schedule]} onPress={onPress} />
  );

  fireEvent.press(screen.getByText('可点击日程'));
  expect(onPress).toHaveBeenCalledWith(schedule);
});
```

Note: This test imports `ScheduleList` directly. Add the import at the top of the test file:

```typescript
import { ScheduleList } from '../../src/components/schedule-list';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: FAIL — `onPress` not in props / press event doesn't trigger callback

- [ ] **Step 3: Add `onPress` to ScheduleList**

In `src/components/schedule-list.tsx`:

Add `Pressable` import:

```typescript
import { FlatList, Pressable } from 'react-native'
```

Update the props type:

```typescript
type ScheduleListProps = {
  schedules: Schedule[]
  emptyMessage?: string
  onDelete?(schedule: Schedule): void
  onPress?(schedule: Schedule): void
}
```

Update the component destructuring:

```typescript
export function ScheduleList({ schedules, emptyMessage, onDelete, onPress }: ScheduleListProps) {
```

Wrap the Card with Pressable in `renderItem`:

```typescript
renderItem={({ item: schedule }) => (
  <Pressable onPress={() => onPress?.(schedule)}>
    <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" marginBottom="$3">
      {/* ... existing content unchanged ... */}
    </Card>
  </Pressable>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule-list.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat(schedule): make schedule list cards tappable with onPress"
```

---

### Task 4: Wire up navigation from IndexScreen to detail page

**Files:**
- Modify: `app/index.tsx:153`

- [ ] **Step 1: Write the failing test**

In `app/__tests__/input-to-draft-flow.test.tsx`, add:

```typescript
it('navigates to schedule detail when a schedule card is tapped', async () => {
  const now = dayjs().hour(12).minute(0).second(0).toISOString();
  renderWithProviders(
    <IndexScreen
      schedules={[
        {
          id: 's-detail',
          title: '点击查看详情',
          startAt: now,
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 10,
          recurrence: Recurrence.NONE,
          notes: '',
          createdAt: now,
          updatedAt: now,
        },
      ]}
    />
  );

  fireEvent.press(screen.getByText('点击查看详情'));
  expect(mockRouterPush).toHaveBeenCalledWith('/schedule/s-detail');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: FAIL — `mockRouterPush` not called with `/schedule/s-detail`

- [ ] **Step 3: Add onPress handler in IndexScreen**

In `app/index.tsx`, add a callback (after `handleDelete`):

```typescript
const handlePress = useCallback((schedule: Schedule) => {
  router.push(`/schedule/${schedule.id}`)
}, [router])
```

Update the ScheduleList usage (line 153):

```typescript
<ScheduleList schedules={filteredItems} emptyMessage={emptyMessage} onDelete={handleDelete} onPress={handlePress} />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=input-to-draft-flow`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat(schedule): navigate to detail page on schedule card tap"
```

---

### Task 5: Create the schedule detail page

**Files:**
- Create: `app/schedule/[id].tsx`
- Modify: `jest.setup.ts:12-20` (add `useLocalSearchParams` mock)

- [ ] **Step 1: Add `useLocalSearchParams` to the expo-router mock**

In `jest.setup.ts`, **replace** the entire expo-router mock block (lines 12-20) and the globalThis assignments (lines 22-23) with:

```typescript
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
    dismissAll: mockRouterDismissAll,
  }),
  useLocalSearchParams: () => mockSearchParams,
  Stack: { Screen: () => null },
}));

(globalThis as Record<string, unknown>).__mockRouterPush = mockRouterPush;
(globalThis as Record<string, unknown>).__mockRouterDismissAll = mockRouterDismissAll;
(globalThis as Record<string, unknown>).__mockRouterBack = mockRouterBack;

Object.defineProperty(globalThis, '__mockSearchParams', {
  set(value: Record<string, string>) {
    mockSearchParams = value ?? {};
  },
  get() {
    return mockSearchParams;
  },
});
```

- [ ] **Step 2: Write the test file for the detail page**

Create `app/__tests__/schedule-detail.test.tsx`:

```typescript
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TamaguiProvider } from 'tamagui';
import config from '../../src/theme/tamagui.config';
import { LocaleProvider } from '../../src/context/LocaleContext';
import { Recurrence } from '../../src/constants';
import { createScheduleRepository } from '../../src/features/schedule/repository';
import type { Schedule } from '../../src/types';

const mockRouterBack = (globalThis as Record<string, unknown>).__mockRouterBack as jest.Mock;

import ScheduleDetailScreen from '../schedule/[id]';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      <LocaleProvider>
        {ui}
      </LocaleProvider>
    </TamaguiProvider>
  );
}

const baseSchedule: Schedule = {
  id: 'schedule-edit-1',
  title: '需求评审会',
  startAt: '2026-03-20T15:00:00.000Z',
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: Recurrence.NONE,
  notes: '带上原型',
  createdAt: '2026-03-19T09:00:00.000Z',
  updatedAt: '2026-03-19T09:00:00.000Z',
};

describe('schedule detail page', () => {
  beforeEach(async () => {
    mockRouterBack.mockClear();
    (globalThis as Record<string, unknown>).__mockSearchParams = { id: 'schedule-edit-1' };
    const repository = createScheduleRepository();
    await repository.createSchedule(baseSchedule);
  });

  afterEach(async () => {
    const repository = createScheduleRepository();
    await repository.deleteSchedule('schedule-edit-1');
  });

  it('loads and displays the schedule in the form', async () => {
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('需求评审会')).toBeOnTheScreen();
    });
    expect(screen.getByDisplayValue('带上原型')).toBeOnTheScreen();
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('saves edited schedule and navigates back', async () => {
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('需求评审会')).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByLabelText('Event Name'), '更新后的会议');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalled();
    });

    const repository = createScheduleRepository();
    const updated = await repository.getScheduleById('schedule-edit-1');
    expect(updated?.title).toBe('更新后的会议');
  });

  it('navigates back when schedule is not found', async () => {
    (globalThis as Record<string, unknown>).__mockSearchParams = { id: 'non-existent' };
    renderWithProviders(<ScheduleDetailScreen />);

    await waitFor(() => {
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- --testPathPattern=schedule-detail`
Expected: FAIL — module `../schedule/[id]` not found

- [ ] **Step 4: Create `app/schedule/[id].tsx`**

```typescript
import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform, ScrollView } from 'react-native'
import { Spinner, YStack } from 'tamagui'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useLocale } from '../../src/context/LocaleContext'

import { ScheduleDraftForm } from '../../src/components/schedule-draft-form'
import { createScheduleRepository } from '../../src/features/schedule/repository'
import { createReminderScheduler } from '../../src/features/schedule/reminders'
import { validateDraft } from '../../src/features/schedule/validation'
import type { Schedule, ScheduleDraft } from '../../src/types'

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
    createScheduleRepository()
      .getScheduleById(id)
      .then((found) => {
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
      const repository = createScheduleRepository()
      const reminders = createReminderScheduler()

      const updated: Schedule = {
        ...schedule,
        title: draft.title,
        startAt: draft.startAt,
        endAt: draft.endAt,
        timezone: draft.timezone,
        reminderMinutesBefore: draft.reminderMinutesBefore,
        recurrence: draft.recurrence,
        notes: draft.notes,
        updatedAt: new Date().toISOString(),
      }

      if (
        schedule.reminderMinutesBefore !== draft.reminderMinutesBefore ||
        schedule.startAt !== draft.startAt
      ) {
        const newNotificationId = await reminders.updateReminder(updated, t)
        updated.notificationId = newNotificationId
      }

      await repository.updateSchedule(updated)
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

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=schedule-detail`
Expected: ALL PASS

- [ ] **Step 6: Run all tests to verify nothing is broken**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add jest.setup.ts app/schedule/[id].tsx app/__tests__/schedule-detail.test.tsx
git commit -m "feat(schedule): add schedule detail page with edit and save"
```

---

### Task 6: Type check and final verification

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Fix any issues found**

If typecheck or tests fail, fix the issues.

- [ ] **Step 4: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve typecheck and test issues for schedule detail"
```
