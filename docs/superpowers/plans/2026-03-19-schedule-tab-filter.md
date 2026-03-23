# Schedule Tab Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tab-based filtering (Today/Tomorrow/All) to the schedule list page with segmented control UI.

**Architecture:** Migrate existing `as const` enum to TypeScript `enum`, add `ScheduleTab` enum, install `dayjs` for date comparison, implement frontend-only filtering in `app/index.tsx` with segmented control UI using Tamagui components.

**Tech Stack:** TypeScript enum, dayjs, Tamagui (XStack, Button), Jest + Testing Library

---

### Task 1: Install dayjs

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dayjs**

Run: `npm install dayjs`

- [ ] **Step 2: Verify installation**

Run: `node -e "require('dayjs')"`
Expected: no error

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add dayjs dependency"
```

---

### Task 2: Migrate Recurrence to TypeScript enum

**Files:**
- Modify: `src/constants/recurrence.ts`
- Modify: `src/constants/index.ts`
- Modify: `src/types/schedule.ts`
- Modify: `src/features/schedule/validation.ts`
- Modify: `src/features/schedule/normalizer.ts`
- Modify: `src/lib/date-time.ts`
- Test: `src/features/schedule/__tests__/validation.test.ts`
- Test: `src/features/schedule/__tests__/normalizer.test.ts`

- [ ] **Step 1: Rewrite `src/constants/recurrence.ts` to enum**

```ts
export enum Recurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
```

- [ ] **Step 2: Update `src/constants/index.ts`**

Replace `export { RECURRENCE_VALUES } from './recurrence'` with `export { Recurrence } from './recurrence'`. Keep `PENDING_DRAFT_KEY` export.

- [ ] **Step 3: Update `src/types/schedule.ts`**

Remove the `import { RECURRENCE_VALUES } from '../constants'` and the `export type Recurrence = ...` derivation. Instead:

```ts
import { Recurrence } from '../constants';
export { Recurrence };
```

Keep all other type definitions unchanged. The `Recurrence` type in `ScheduleDraft` and `Schedule` remains the same field name.

- [ ] **Step 4: Update `src/types/index.ts`**

The file currently re-exports `Recurrence` from `./schedule`. Since `schedule.ts` now re-exports the enum, no change needed here — verify it still works.

- [ ] **Step 5: Update `src/features/schedule/validation.ts`**

Replace `RECURRENCE_VALUES` import and usage:

```ts
import { Recurrence } from '../../constants';
import type { Schedule, ScheduleDraft, ValidationResult } from '../../types';

function isAllowedRecurrence(value: string) {
  return Object.values(Recurrence).includes(value as Recurrence);
}
```

Rest of the file unchanged.

- [ ] **Step 6: Update `src/features/schedule/normalizer.ts`**

Replace string literals with enum members:

```ts
import { Recurrence } from '../../constants';
import type { ParsedSchedulePayload, ScheduleDraft } from '../../types';

function toRecurrence(value?: string): Recurrence {
  if (value === Recurrence.DAILY || value === Recurrence.WEEKLY || value === Recurrence.MONTHLY) {
    return value;
  }

  return Recurrence.NONE;
}
```

Rest of the file unchanged.

- [ ] **Step 7: Update `src/lib/date-time.ts`**

Replace string literals with enum members:

```ts
import { Recurrence } from '../constants';
import type { RepeatTrigger } from '../types';

export function subtractMinutes(isoString: string, minutes: number) {
  return new Date(new Date(isoString).getTime() - minutes * 60 * 1000);
}

export function getRepeatTrigger(recurrence: Recurrence, date: Date): RepeatTrigger | null {
  if (recurrence === Recurrence.DAILY) {
    return {
      type: 'daily',
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  if (recurrence === Recurrence.WEEKLY) {
    return {
      type: 'weekly',
      weekday: date.getUTCDay() + 1,
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  if (recurrence === Recurrence.MONTHLY) {
    return {
      type: 'monthly',
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }

  return null;
}
```

- [ ] **Step 8: Run existing tests to verify migration**

Run: `npm test -- --testPathPattern="(normalizer|validation)"`
Expected: all tests PASS. The tests use string literals like `'WEEKLY'` and `'NONE'` in assertions — these still match because TypeScript enum values are the same strings at runtime.

- [ ] **Step 9: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add src/constants/recurrence.ts src/constants/index.ts src/types/schedule.ts src/features/schedule/validation.ts src/features/schedule/normalizer.ts src/lib/date-time.ts
git commit -m "refactor: migrate Recurrence from as-const array to TypeScript enum"
```

---

### Task 3: Add ScheduleTab enum

**Files:**
- Create: `src/constants/schedule-tab.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Create `src/constants/schedule-tab.ts`**

```ts
export enum ScheduleTab {
  TODAY = 'TODAY',
  TOMORROW = 'TOMORROW',
  ALL = 'ALL',
}
```

- [ ] **Step 2: Update `src/constants/index.ts` to export ScheduleTab**

```ts
export { Recurrence } from './recurrence';
export { ScheduleTab } from './schedule-tab';
export const PENDING_DRAFT_KEY = 'pending-draft'
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/constants/schedule-tab.ts src/constants/index.ts
git commit -m "feat: add ScheduleTab enum"
```

---

### Task 4: Add i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/zh.json`
- Modify: `src/i18n/locales/zh-TW.json`
- Modify: `src/i18n/types.ts`

- [ ] **Step 1: Add keys to `src/i18n/locales/en.json`**

In the `schedule` object, after `"yearly": "Yearly"`, add:

```json
"tabToday": "Today",
"tabTomorrow": "Tomorrow",
"tabAll": "All",
"emptyToday": "No schedules today",
"emptyTomorrow": "No schedules tomorrow"
```

- [ ] **Step 2: Add keys to `src/i18n/locales/zh.json`**

In the `schedule` object, after `"yearly": "每年"`, add:

```json
"tabToday": "今日",
"tabTomorrow": "明日",
"tabAll": "全部",
"emptyToday": "今日暂无日程",
"emptyTomorrow": "明日暂无日程"
```

- [ ] **Step 3: Add keys to `src/i18n/locales/zh-TW.json`**

In the `schedule` object, after `"yearly": "每年"`, add:

```json
"tabToday": "今日",
"tabTomorrow": "明日",
"tabAll": "全部",
"emptyToday": "今日暫無日程",
"emptyTomorrow": "明日暫無日程"
```

- [ ] **Step 4: Update `src/i18n/types.ts`**

In the `schedule` section of `TranslationKeys`, after `yearly: string;`, add:

```ts
tabToday: string;
tabTomorrow: string;
tabAll: string;
emptyToday: string;
emptyTomorrow: string;
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/zh.json src/i18n/locales/zh-TW.json src/i18n/types.ts
git commit -m "feat: add i18n keys for schedule tab filter"
```

---

### Task 5: Add emptyMessage prop to ScheduleList

**Files:**
- Modify: `src/components/schedule-list.tsx`
- Test: `app/__tests__/input-to-draft-flow.test.tsx` (existing test at line 61 checks "No schedules yet")

- [ ] **Step 1: Write the failing test**

Add this test case in `app/__tests__/input-to-draft-flow.test.tsx` inside the `'page navigation flow'` describe block:

```ts
it('renders schedule list with custom empty message', async () => {
  renderWithProviders(<IndexScreen schedules={[]} />);

  await waitFor(() => {
    expect(screen.getByText('No schedules yet')).toBeOnTheScreen();
  });
});
```

This test passes today (it's essentially the same as the existing line 57-63 test). It documents the default behavior before we change it.

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --testPathPattern="input-to-draft-flow"`
Expected: PASS

- [ ] **Step 3: Add `emptyMessage` prop to `src/components/schedule-list.tsx`**

Update the props type and the empty state rendering:

```ts
type ScheduleListProps = {
  schedules: Schedule[]
  emptyMessage?: string
  onDelete?(schedule: Schedule): void
}

export function ScheduleList({ schedules, emptyMessage, onDelete }: ScheduleListProps) {
  const { t, locale } = useLocale()

  const intlLocale = locale === 'zh' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  if (schedules.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <SizableText color="$placeholderColor">{emptyMessage ?? t('schedule.emptyList')}</SizableText>
      </YStack>
    )
  }
```

Rest of the component unchanged.

- [ ] **Step 4: Run tests to verify nothing breaks**

Run: `npm test -- --testPathPattern="input-to-draft-flow"`
Expected: all PASS (default behavior unchanged since `emptyMessage` is optional)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule-list.tsx
git commit -m "feat: add emptyMessage prop to ScheduleList component"
```

---

### Task 6: Implement tab filter UI and logic in IndexScreen

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Write a failing test for tab rendering**

Add in `app/__tests__/input-to-draft-flow.test.tsx`:

```ts
it('renders tab controls with Today selected by default', async () => {
  renderWithProviders(<IndexScreen schedules={[]} />);

  await waitFor(() => {
    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
    expect(screen.getByText('All')).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="input-to-draft-flow" -t "renders tab controls"`
Expected: FAIL — "Today" text not found

- [ ] **Step 3: Write a failing test for tab filtering**

Add in `app/__tests__/input-to-draft-flow.test.tsx`:

```ts
it('filters schedules by selected tab', async () => {
  const today = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  renderWithProviders(
    <IndexScreen
      schedules={[
        {
          id: 's-today',
          title: '今日会议',
          startAt: today,
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 10,
          recurrence: 'NONE',
          notes: '',
          createdAt: today,
          updatedAt: today,
        },
        {
          id: 's-tomorrow',
          title: '明日会议',
          startAt: tomorrow,
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 10,
          recurrence: 'NONE',
          notes: '',
          createdAt: today,
          updatedAt: today,
        },
      ]}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('今日会议')).toBeOnTheScreen();
  });
  expect(screen.queryByText('明日会议')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByText('Tomorrow'));

  await waitFor(() => {
    expect(screen.getByText('明日会议')).toBeOnTheScreen();
  });
  expect(screen.queryByText('今日会议')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByText('All'));

  await waitFor(() => {
    expect(screen.getByText('今日会议')).toBeOnTheScreen();
    expect(screen.getByText('明日会议')).toBeOnTheScreen();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- --testPathPattern="input-to-draft-flow" -t "filters schedules"`
Expected: FAIL

- [ ] **Step 5: Write a failing test for tab-specific empty state**

Add in `app/__tests__/input-to-draft-flow.test.tsx`:

```ts
it('shows tab-specific empty message when no schedules match', async () => {
  renderWithProviders(<IndexScreen schedules={[]} />);

  await waitFor(() => {
    expect(screen.getByText('No schedules today')).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByText('Tomorrow'));

  await waitFor(() => {
    expect(screen.getByText('No schedules tomorrow')).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByText('All'));

  await waitFor(() => {
    expect(screen.getByText('No schedules yet')).toBeOnTheScreen();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- --testPathPattern="input-to-draft-flow" -t "shows tab-specific empty"`
Expected: FAIL

- [ ] **Step 7: Implement tab UI and filtering in `app/index.tsx`**

Add imports at top:

```ts
import dayjs from 'dayjs'
import { ScheduleTab } from '../src/constants'
```

Add filter function before the component:

```ts
function filterSchedules(schedules: Schedule[], tab: ScheduleTab): Schedule[] {
  if (tab === ScheduleTab.ALL) return schedules
  const target = tab === ScheduleTab.TODAY ? dayjs() : dayjs().add(1, 'day')
  return schedules.filter((s) => dayjs(s.startAt).isSame(target, 'day'))
}
```

Add tab labels map inside the component:

```ts
const TAB_LABELS: { key: ScheduleTab; label: string }[] = [
  { key: ScheduleTab.TODAY, label: t('schedule.tabToday') },
  { key: ScheduleTab.TOMORROW, label: t('schedule.tabTomorrow') },
  { key: ScheduleTab.ALL, label: t('schedule.tabAll') },
]
```

Add state and derived values:

```ts
const [activeTab, setActiveTab] = useState<ScheduleTab>(ScheduleTab.TODAY)
const filteredItems = filterSchedules(items, activeTab)

const emptyMessage = activeTab === ScheduleTab.TODAY
  ? t('schedule.emptyToday')
  : activeTab === ScheduleTab.TOMORROW
    ? t('schedule.emptyTomorrow')
    : undefined
```

Add `XStack` import from tamagui. In the JSX, after `<Stack.Screen>` and inside the `<YStack flex={1}>`, add the segmented control before the loading/error/list conditional:

```tsx
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
      color={activeTab === key ? 'white' : '$color'}
      onPress={() => setActiveTab(key)}
    >
      {label}
    </Button>
  ))}
</XStack>
```

Update `ScheduleList` invocation to pass `emptyMessage` and `filteredItems`:

```tsx
<ScheduleList schedules={filteredItems} emptyMessage={emptyMessage} onDelete={handleDelete} />
```

- [ ] **Step 8: Update the existing empty list test**

The existing test at line 57-63 (`'renders the home screen with schedule list'`) checks for "No schedules yet". Since default tab is now Today, the empty message is "No schedules today". Update:

```ts
it('renders the home screen with schedule list', async () => {
  renderWithProviders(<IndexScreen schedules={[]} />);

  await waitFor(() => {
    expect(screen.getByText('No schedules today')).toBeOnTheScreen();
  });
});
```

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: all PASS

- [ ] **Step 10: Run typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 11: Commit**

```bash
git add app/index.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat: add tab-based schedule filtering with segmented control UI"
```
