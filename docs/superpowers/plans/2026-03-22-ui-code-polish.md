# UI/UX & Code Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the entire app with a restrained Apple-inspired design system, extract shared components/hooks/utils, and fix i18n gaps.

**Architecture:** Design-system-first approach — build foundations (constants, components, hooks, utils) in Tasks 1-6, then apply them to each page in Tasks 7-11, then clean up in Task 12.

**Tech Stack:** Expo 55, React Native 0.83, React 19, Tamagui 2.0-rc, React Native Animated API, i18n-js

**Spec:** `docs/superpowers/specs/2026-03-22-ui-code-polish-design.md`

---

### Task 1: Update Color Tokens & Constants

**Files:**
- Modify: `client/src/constants/index.ts`

- [ ] **Step 1: Update constants file**

Update `PAGE_BACKGROUND` value, replace `CARD_COLORS` array, remove `CARD_PROGRESS_COLORS`, and add three new tokens (`PILL_UNSELECTED_BG`, `LABEL_COLOR`, `SECONDARY_TEXT`). `ACCENT_COLOR` and `ACCENT_COLOR_PRESSED` remain unchanged:

```typescript
export const ACCENT_COLOR = '#E8725C'
export const ACCENT_COLOR_PRESSED = '#D4634E'
export const PAGE_BACKGROUND = '#FAFAFA'
export const PILL_UNSELECTED_BG = '#F3F4F6'
export const LABEL_COLOR = '#9CA3AF'
export const SECONDARY_TEXT = '#6B7280'

export const CARD_COLORS = [
  '#FEF2F0', // warm pink
  '#FFF5EB', // warm orange
  '#F0F5F2', // sage green
  '#EFF1FE', // soft blue
  '#F5F0F9', // soft purple
]
```

Remove `CARD_PROGRESS_COLORS` entirely. Keep `PENDING_DRAFT_KEY`, `Recurrence`, `ScheduleTab` unchanged.

- [ ] **Step 2: Run typecheck to verify no broken references**

Run: `cd client && npx tsc --noEmit`
Expected: No errors (CARD_PROGRESS_COLORS removal may cause errors in schedule-list.tsx — that's expected and fixed in Task 8)

- [ ] **Step 3: Commit**

```bash
git add client/src/constants/index.ts
git commit -m "refactor: update color tokens and remove progress colors"
```

---

### Task 2: Create Shared Date Format Utilities

**Files:**
- Create: `client/src/lib/date-format.ts`

- [ ] **Step 1: Create date-format.ts**

Move and consolidate date/time formatting functions from `schedule-list.tsx` (lines 23-47) and `date-time-picker.tsx` (lines 13-48). Note: `formatTime` and `formatTimePart` are identical (both use `hour: '2-digit', minute: '2-digit'`). Keep both for now since different callers use different names — a future cleanup can alias them. Similarly, `formatDate` (month+day for card display) and `formatDatePart` (year+month+day for picker display) differ in whether they include the year:

```typescript
export function formatDate(isoString: string, locale?: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}

export function formatTime(isoString: string, locale?: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

export function formatDatePart(isoString: string, locale?: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}

export function formatTimePart(isoString: string, locale?: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return ''
  }
}

export function toDatetimeLocalValue(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  } catch {
    return ''
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/date-format.ts
git commit -m "refactor: extract shared date formatting utilities"
```

---

### Task 3: Create useDeviceId Hook

**Files:**
- Create: `client/src/hooks/useDeviceId.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useDeviceId(): { deviceId: string | null; loading: boolean } {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then((id) => {
      setDeviceId(id)
      setLoading(false)
    })
  }, [])

  return { deviceId, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useDeviceId.ts
git commit -m "refactor: extract useDeviceId hook"
```

---

### Task 4: Create AccentButton & PillButton Components

**Files:**
- Create: `client/src/components/accent-button.tsx`
- Create: `client/src/components/pill-button.tsx`

- [ ] **Step 1: Create accent-button.tsx**

```typescript
import { Button, type ButtonProps, SizableText } from 'tamagui'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED } from '../constants'

type AccentButtonProps = ButtonProps & {
  label: string
}

export function AccentButton({ label, ...props }: AccentButtonProps) {
  return (
    <Button
      size="$5"
      backgroundColor={ACCENT_COLOR}
      borderRadius={12}
      hoverStyle={{ backgroundColor: ACCENT_COLOR }}
      pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
      disabledStyle={{ backgroundColor: ACCENT_COLOR, opacity: 0.5 }}
      {...props}
    >
      <SizableText color="white" fontWeight="600" size="$4">
        {label}
      </SizableText>
    </Button>
  )
}
```

- [ ] **Step 2: Create pill-button.tsx**

```typescript
import { Button, SizableText } from 'tamagui'
import { ACCENT_COLOR, ACCENT_COLOR_PRESSED, PILL_UNSELECTED_BG, SECONDARY_TEXT } from '../constants'

type PillButtonProps = {
  selected: boolean
  onPress(): void
  disabled?: boolean
  children: string
}

export function PillButton({ selected, onPress, disabled, children }: PillButtonProps) {
  return (
    <Button
      size="$3"
      borderRadius={20}
      borderWidth={0}
      backgroundColor={selected ? ACCENT_COLOR : PILL_UNSELECTED_BG}
      onPress={onPress}
      disabled={disabled}
      hoverStyle={{
        backgroundColor: selected ? ACCENT_COLOR : '#E5E7EB',
      }}
      pressStyle={{
        backgroundColor: selected ? ACCENT_COLOR_PRESSED : '#D1D5DB',
      }}
      disabledStyle={{
        backgroundColor: selected ? ACCENT_COLOR : PILL_UNSELECTED_BG,
        opacity: 0.5,
      }}
    >
      <SizableText size="$3" color={selected ? 'white' : SECONDARY_TEXT}>
        {children}
      </SizableText>
    </Button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/accent-button.tsx client/src/components/pill-button.tsx
git commit -m "feat: add AccentButton and PillButton components"
```

---

### Task 5: Create EmptyState Component

**Files:**
- Create: `client/src/components/empty-state.tsx`

- [ ] **Step 1: Create empty-state.tsx**

```typescript
import { SizableText, YStack } from 'tamagui'
import { LABEL_COLOR } from '../constants'

type EmptyStateProps = {
  icon: string
  iconBg?: string
  title: string
  subtitle?: string
}

export function EmptyState({ icon, iconBg = '#F3F4F6', title, subtitle }: EmptyStateProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <YStack
        width={80}
        height={80}
        borderRadius={40}
        backgroundColor={iconBg}
        justifyContent="center"
        alignItems="center"
      >
        <SizableText fontSize={36}>{icon}</SizableText>
      </YStack>
      <SizableText fontWeight="600" size="$4" color="#111" marginTop="$3">
        {title}
      </SizableText>
      {subtitle ? (
        <SizableText size="$3" color={LABEL_COLOR} marginTop="$1" textAlign="center">
          {subtitle}
        </SizableText>
      ) : null}
    </YStack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/empty-state.tsx
git commit -m "feat: add EmptyState component"
```

---

### Task 6: Create SkeletonCard Component

**Files:**
- Create: `client/src/components/skeleton-card.tsx`

- [ ] **Step 1: Create skeleton-card.tsx**

Uses React Native `Animated` API for pulse animation.

```typescript
import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { YStack } from 'tamagui'

type SkeletonCardProps = {
  count?: number
}

function SkeletonLine({ width, height, delay }: { width: string; height: number; delay: number }) {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [opacity, delay])

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
        opacity,
      }}
    />
  )
}

export function SkeletonCard({ count = 3 }: SkeletonCardProps) {
  return (
    <YStack gap="$2.5">
      {Array.from({ length: count }, (_, i) => (
        <YStack
          key={i}
          backgroundColor="#F3F4F6"
          borderRadius={16}
          paddingHorizontal="$4"
          paddingVertical="$3"
          gap="$2"
        >
          <SkeletonLine width="60%" height={16} delay={i * 200} />
          <SkeletonLine width="40%" height={12} delay={i * 200 + 100} />
        </YStack>
      ))}
    </YStack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/skeleton-card.tsx
git commit -m "feat: add SkeletonCard loading component"
```

---

### Task 7: Add i18n Keys

**Files:**
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/zh.json`
- Modify: `client/src/i18n/locales/zh-TW.json`

- [ ] **Step 1: Add new keys to en.json**

Add to `schedule` section after `"emptyTomorrow"`:
```json
"emptyTodayHint": "Tap + to create with natural language",
"emptyTomorrowHint": "No plans yet for tomorrow",
"emptyListHint": "Tap + to get started",
"notFound": "Schedule not found"
```

Add new `picker` section after `messages`:
```json
"picker": {
  "cancel": "Cancel",
  "selectDate": "Select Date",
  "selectTime": "Select Time",
  "next": "Next",
  "confirm": "Done"
}
```

- [ ] **Step 2: Add new keys to zh.json**

Add to `schedule` section after `"emptyTomorrow"`:
```json
"emptyTodayHint": "点击 + 用自然语言创建日程",
"emptyTomorrowHint": "明天暂无安排",
"emptyListHint": "点击 + 开始创建",
"notFound": "未找到该日程"
```

Add new `picker` section:
```json
"picker": {
  "cancel": "取消",
  "selectDate": "选择日期",
  "selectTime": "选择时间",
  "next": "下一步",
  "confirm": "确定"
}
```

- [ ] **Step 3: Add new keys to zh-TW.json**

Add to `schedule` section after `"emptyTomorrow"`:
```json
"emptyTodayHint": "點擊 + 用自然語言建立日程",
"emptyTomorrowHint": "明天暫無安排",
"emptyListHint": "點擊 + 開始建立",
"notFound": "未找到該日程"
```

Add new `picker` section:
```json
"picker": {
  "cancel": "取消",
  "selectDate": "選擇日期",
  "selectTime": "選擇時間",
  "next": "下一步",
  "confirm": "確定"
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/i18n/locales/en.json client/src/i18n/locales/zh.json client/src/i18n/locales/zh-TW.json
git commit -m "feat: add i18n keys for empty states and picker"
```

---

### Task 8: Redesign Schedule List (schedule-list.tsx)

**Files:**
- Modify: `client/src/components/schedule-list.tsx`

- [ ] **Step 1: Rewrite schedule-list.tsx**

Key changes:
- Remove `getTimeProgress()`, `getProgressColor()`, progress bar View, `useEffect` tick interval, `CARD_PROGRESS_COLORS` import
- Import `formatDate`, `formatTime` from `@/lib/date-format`
- Import `CARD_COLORS`, `SECONDARY_TEXT` from `@/constants`
- Import `Recurrence` from `@/constants`
- Add `showDate?: boolean` prop
- Remove `emptyMessage` prop and internal empty state rendering (parent handles it)
- Redesign card to two-line compact layout:
  - Line 1: title (fontWeight=600, size=$4)
  - Line 2: XStack with time (+ date if showDate), recurrence text (if not NONE), reminder (if > 0)
- Replace hardcoded `#666666` with `SECONDARY_TEXT`
- Replace `View` progress bar with clean card

The card meta line should show:
- Time: `formatTime(schedule.startAt, intlLocale)` or `formatTime(startAt) – formatTime(endAt)` if endAt exists
- Date prefix (when showDate=true): `formatDate(schedule.startAt, intlLocale) · `
- Recurrence badge (when not NONE): use `t('schedule.daily')` etc. from i18n
- Reminder badge (when > 0): `🔔 ${schedule.reminderMinutesBefore}min`

Separate meta items with ` · ` or use gap spacing.

The component needs access to `useLocale` for `t()` (recurrence labels) and `locale` (date formatting).

- [ ] **Step 2: Run tests**

Run: `cd client && npm test -- --testPathPattern="input-to-draft-flow" --no-coverage`

Some tests may need updates since empty state is now handled by parent (the test `'shows tab-specific empty message when no schedules match'` renders `IndexScreen` which will change in Task 9). Note any failures — they'll be fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/schedule-list.tsx
git commit -m "feat: redesign schedule cards with compact two-line layout"
```

---

### Task 9: Update Index Page (index.tsx)

**Files:**
- Modify: `client/app/index.tsx`

- [ ] **Step 1: Update index.tsx**

Key changes:
- Import `PillButton` from `@/components/pill-button`
- Import `AccentButton` from `@/components/accent-button`
- Import `EmptyState` from `@/components/empty-state`
- Import `SkeletonCard` from `@/components/skeleton-card`
- Import `useDeviceId` from `@/hooks/useDeviceId`
- Replace `AsyncStorage.getItem('deviceId')` with `useDeviceId()` hook. Use `deviceId` inside `useFocusEffect`. Update the `useFocusEffect` dependency array to include `deviceId`: `[schedules, t, deviceId]`. When `deviceId` is null (loading), skip the fetch and return early.
- Replace tab Button elements with `PillButton` (remove inline styling for selected/unselected states)
- Replace `Spinner` loading state with `<SkeletonCard />`
- Handle empty state in parent: when `filteredItems.length === 0` and not loading, render `EmptyState` instead of passing `emptyMessage` to ScheduleList
  - Today: `<EmptyState icon="☀️" iconBg="#FEF2F0" title={t('schedule.emptyToday')} subtitle={t('schedule.emptyTodayHint')} />`
  - Tomorrow: `<EmptyState icon="🌙" iconBg="#EFF1FE" title={t('schedule.emptyTomorrow')} subtitle={t('schedule.emptyTomorrowHint')} />`
  - All: `<EmptyState icon="📋" iconBg="#F0F5F2" title={t('schedule.emptyList')} subtitle={t('schedule.emptyListHint')} />`
- Pass `showDate={activeTab === ScheduleTab.ALL}` to `ScheduleList`
- **FAB: keep as inline styled Button** (not AccentButton). The FAB is circular, positioned absolutely, and uses size `$8` text — too different from standard AccentButton. Just ensure it uses the color constants:
    ```tsx
    <Button
      size="$5"
      circular
      backgroundColor={ACCENT_COLOR}
      position="absolute"
      bottom={24}
      right={24}
      elevation="$4"
      onPress={() => router.push('/new')}
      hoverStyle={{ backgroundColor: ACCENT_COLOR }}
      pressStyle={{ backgroundColor: ACCENT_COLOR_PRESSED }}
    >
      <SizableText color="white" size="$8" fontWeight="bold" marginTop={-2}>+</SizableText>
    </Button>
    ```
    This is identical to current code — no change needed for FAB.

- [ ] **Step 2: Update tests**

In `client/app/__tests__/input-to-draft-flow.test.tsx`:
- The test `'shows tab-specific empty message when no schedules match'` — update assertions to look for the EmptyState content. The titles remain the same (`'No schedules today'`, `'No schedules tomorrow'`, `'No schedules yet'`), but now they also show subtitle hints. If tests still pass by matching title text, no change needed.
- The test `'renders schedule card with time range when endAt exists'` — ScheduleList no longer renders empty state, so verify IndexScreen still works with schedules.
- The test `'navigates to new schedule page when FAB is pressed'` — the FAB text `'+'` should still be findable.

Run: `cd client && npm test -- --no-coverage`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add client/app/index.tsx client/app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat: update index page with design system components"
```

---

### Task 10: Update Draft Page & Form Components

**Files:**
- Modify: `client/src/components/schedule-draft-form.tsx`
- Modify: `client/src/components/message-input-form.tsx`
- Modify: `client/src/components/date-time-picker.tsx`
- Modify: `client/app/draft.tsx`
- Modify: `client/app/new.tsx`

- [ ] **Step 1: Update schedule-draft-form.tsx**

Key changes:
- Import `PillButton` from `./pill-button`
- Import `AccentButton` from `./accent-button`
- Import `LABEL_COLOR` from `@/constants` (remove ACCENT_COLOR import if no longer used here)
- Change all FormSection label color: `color={ACCENT_COLOR}` → `color={LABEL_COLOR}`, `fontWeight="600"` → `fontWeight="500"`
- Replace recurrence inline Buttons with `<PillButton selected={...} onPress={...}>{label}</PillButton>`
- Replace submit Button with `<AccentButton label={submitLabel ?? t('schedule.create')} onPress={onSubmit} disabled={disabled} />`
- Change reminder unit: hardcoded `"min"` → `t('schedule.minutes')`
- Update error display: wrap errors in styled container
  ```tsx
  {errors.map((error) => (
    <XStack key={error} backgroundColor="#FEF2F2" borderRadius={12} padding="$3" alignItems="center" gap="$2">
      <SizableText size="$3">⚠️</SizableText>
      <SizableText color="#DC2626" size="$3" flex={1}>{error}</SizableText>
    </XStack>
  ))}
  ```

- [ ] **Step 2: Update message-input-form.tsx**

Key changes:
- Import `AccentButton` from `./accent-button`
- Replace submit Button with `<AccentButton label={t('schedule.create')} onPress={handleSubmit} disabled={submitting} icon={submitting ? <Spinner size="small" /> : undefined} />`
- Update error display to match same styled container as draft form

- [ ] **Step 3: Update date-time-picker.tsx**

Key changes:
- Import `useLocale` from `@/context/LocaleContext`
- Import `formatDatePart`, `formatTimePart`, `toDatetimeLocalValue` from `@/lib/date-format`
- Remove local `formatDatePart`, `formatTimePart`, `toDatetimeLocalValue` function definitions
- In `NativeDateTimePicker`, add `const { t } = useLocale()` (need to pass `t` as prop or use hook directly)
  - Since `NativeDateTimePicker` is a local component, use `useLocale()` directly inside it
- Replace hardcoded strings:
  - `'取消'` → `t('picker.cancel')`
  - `mode === 'date' ? '选择日期' : '选择时间'` → `mode === 'date' ? t('picker.selectDate') : t('picker.selectTime')`
  - `mode === 'date' ? '下一步' : '确定'` → `mode === 'date' ? t('picker.next') : t('picker.confirm')`
- Web input: replace `backgroundColor: '#FFF0ED'` → `backgroundColor: '#F3F4F6'`

- [ ] **Step 4: Update draft.tsx**

Key changes:
- Import `SkeletonCard` from `@/components/skeleton-card`
- Import `useDeviceId` from `@/hooks/useDeviceId`
- Replace `Spinner` in loading state with `<SkeletonCard count={5} />`
- Replace `AsyncStorage.getItem('deviceId')` in `handleCreateSchedule` with the deviceId from hook (pass as parameter or use closure)
- Background: `PAGE_BACKGROUND` already imported and used — just verify value update takes effect

- [ ] **Step 5: Update new.tsx**

Key changes:
- Import `useDeviceId` from `@/hooks/useDeviceId`
- Replace `AsyncStorage.getItem('deviceId')` in `defaultSubmit` with hook value. Since `defaultSubmit` is a standalone function, the simplest approach: keep it as-is (it already reads from AsyncStorage internally). The hook is more beneficial in pages that use deviceId for API calls directly. For new.tsx, the hook usage is optional — `defaultSubmit` already works correctly.
- Background: `PAGE_BACKGROUND` already used — value update from Task 1 takes effect automatically

- [ ] **Step 6: Run tests**

Run: `cd client && npm test -- --no-coverage`
Expected: All tests pass. Key tests to watch:
- `'shows draft validation errors when required fields are missing'` — errors now render in styled container, but text content is same
- `'renders the draft screen'` — "Create Schedule" text should still be findable inside AccentButton
- `'shows a fallback parse error'` — "Operation failed" text inside styled error container

- [ ] **Step 7: Commit**

```bash
git add client/src/components/schedule-draft-form.tsx client/src/components/message-input-form.tsx client/src/components/date-time-picker.tsx client/app/draft.tsx client/app/new.tsx
git commit -m "feat: apply design system to form components and pages"
```

---

### Task 11: Update Detail Page (schedule/[id].tsx)

**Files:**
- Modify: `client/app/schedule/[id].tsx`

- [ ] **Step 1: Update schedule detail page**

Key changes:
- Import `SkeletonCard` from `@/components/skeleton-card`
- Import `EmptyState` from `@/components/empty-state`
- Import `useDeviceId` from `@/hooks/useDeviceId`
- Replace `Spinner` loading state with `<SkeletonCard count={5} />`
- For not-found case: instead of showing alert and navigating back, show `<EmptyState icon="🔍" iconBg="#F3F4F6" title={t('schedule.notFound')} />` inline. This is a UX improvement — the user sees a clear message instead of an intrusive alert.
  - Note: this changes existing behavior. The current approach alerts then goes back. New approach: set a `notFound` state, render EmptyState. Keep a "Back" button or let the nav header handle it.
  - Simplest: add `const [notFound, setNotFound] = useState(false)`, set it in the not-found branch, render EmptyState when true.
- Replace `AsyncStorage.getItem('deviceId')` with `useDeviceId()` hook
- Handle states: when `deviceLoading` is true OR `deviceId` is null, show `<SkeletonCard count={5} />`. When loaded and deviceId exists, proceed to fetch schedule. When schedule not found, show EmptyState.

- [ ] **Step 2: Update tests**

In `client/app/__tests__/schedule-detail.test.tsx`:
- Test `'navigates back when schedule is not found'` — change assertion from `mockRouterBack` to checking for `'Schedule not found'` text rendered by EmptyState. Remove the Alert mock expectation.

Run: `cd client && npm test -- --testPathPattern="schedule-detail" --no-coverage`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add client/app/schedule/[id].tsx client/app/__tests__/schedule-detail.test.tsx
git commit -m "feat: update detail page with skeleton loading and empty state"
```

---

### Task 12: Code Cleanup

**Files:**
- Delete: `client/src/components/form-field.tsx`

- [ ] **Step 1: Delete unused form-field.tsx**

```bash
rm client/src/components/form-field.tsx
```

- [ ] **Step 2: Run full test suite**

Run: `cd client && npm test -- --no-coverage`
Expected: All tests pass

- [ ] **Step 3: Run typecheck**

Run: `cd client && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add -u client/src/components/form-field.tsx
git commit -m "chore: delete unused form-field component"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npm run test:all`
Expected: All client and server tests pass

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck:all`
Expected: No type errors across all workspaces

- [ ] **Step 3: Start dev server and visually verify on iOS**

Run: `npm start` (port 4398)
Open in iOS Simulator. Verify:
- Index page: FAFAFA background, pill tabs with gray unselected fill, skeleton loading, EmptyState with icons
- Schedule cards: pastel backgrounds, two-line layout, no progress bar
- New page: accent button, styled error message
- Draft page: gray labels, pill recurrence buttons, "分钟" unit, accent submit button
- Detail page: skeleton loading, EmptyState for not found
- DateTimePicker: localized picker modal text
