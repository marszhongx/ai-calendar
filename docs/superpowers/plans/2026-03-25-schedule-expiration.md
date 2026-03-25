# Schedule Expiration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add expiration logic so expired schedules don't appear in today/tomorrow tabs, and show with strikethrough + gray styling in the ALL tab.

**Architecture:** A pure `isExpired()` utility determines expiration by comparing the current date against `endAt` (or `startAt` if no `endAt`). `occursOnDay()` uses it as a guard. `ScheduleList` receives an expired flag per item for visual styling.

**Tech Stack:** TypeScript, dayjs, Tamagui, Jest + Testing Library

**Spec:** `docs/superpowers/specs/2026-03-25-schedule-expiration-design.md`

---

### Task 1: `isExpired()` utility — tests and implementation

**Files:**
- Create: `src/utils/schedule-expiration.ts`
- Create: `src/utils/__tests__/schedule-expiration.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/schedule-expiration.test.ts`:

```ts
import { Recurrence } from '@/constants'
import type { Schedule } from '@/types/schedule'
import { isExpired } from '../schedule-expiration'

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: '1',
    title: 'Test',
    startAt: '2026-03-20T10:00:00.000Z',
    reminderMinutesBefore: 0,
    recurrence: Recurrence.NONE,
    notes: '',
    originalMessage: '',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    ...overrides,
  }
}

describe('isExpired', () => {
  it('returns false when referenceDate is the same day as startAt (no endAt)', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-25')).toBe(false)
  })

  it('returns true when referenceDate is after startAt day (no endAt)', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-26')).toBe(true)
  })

  it('returns false when referenceDate is before startAt day', () => {
    const s = makeSchedule({ startAt: '2026-03-25T10:00:00.000Z' })
    expect(isExpired(s, '2026-03-24')).toBe(false)
  })

  it('uses endAt as boundary when present', () => {
    const s = makeSchedule({
      startAt: '2026-03-20T10:00:00.000Z',
      endAt: '2026-03-28T18:00:00.000Z',
    })
    expect(isExpired(s, '2026-03-28')).toBe(false) // same day as endAt
    expect(isExpired(s, '2026-03-29')).toBe(true)  // day after endAt
  })

  it('works with recurring schedules (endAt is the termination line)', () => {
    const s = makeSchedule({
      startAt: '2026-03-01T09:00:00.000Z',
      endAt: '2026-03-15T09:00:00.000Z',
      recurrence: Recurrence.DAILY,
    })
    expect(isExpired(s, '2026-03-15')).toBe(false)
    expect(isExpired(s, '2026-03-16')).toBe(true)
  })

  it('defaults referenceDate to today when omitted', () => {
    const past = makeSchedule({ startAt: '2020-01-01T10:00:00.000Z' })
    expect(isExpired(past)).toBe(true)

    const future = makeSchedule({ startAt: '2099-12-31T10:00:00.000Z' })
    expect(isExpired(future)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/utils/__tests__/schedule-expiration.test.ts`
Expected: FAIL — `Cannot find module '../schedule-expiration'`

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/schedule-expiration.ts`:

```ts
import dayjs from 'dayjs'
import type { Schedule } from '../types/schedule'

export function isExpired(schedule: Schedule, referenceDate?: string): boolean {
  const boundary = schedule.endAt ?? schedule.startAt
  const ref = referenceDate ? dayjs(referenceDate) : dayjs()
  return ref.isAfter(dayjs(boundary), 'day')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/utils/__tests__/schedule-expiration.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/schedule-expiration.ts src/utils/__tests__/schedule-expiration.test.ts
git commit -m "feat: add isExpired utility with tests"
```

---

### Task 2: Integrate `isExpired` into `occursOnDay()` filtering

**Files:**
- Modify: `app/index.tsx` (add import, update `occursOnDay` function)

> **Testing note:** `occursOnDay` is a local function in `app/index.tsx` — not exported, not directly testable. The only change is a single `isExpired` guard call, and `isExpired` is thoroughly unit-tested in Task 1. The spec's `app/__tests__/index.test.tsx` entry is not needed; if future refactoring exports `occursOnDay`, tests can be added then.

- [ ] **Step 1: Add import and insert expiration guard**

Add import at top of `app/index.tsx`:
```ts
import { isExpired } from '@/utils/schedule-expiration'
```

In the `occursOnDay` function, insert the following line as the first statement (before `const start = dayjs(...)`):
```ts
if (isExpired(schedule, target.format('YYYY-MM-DD'))) return false
```

No other changes to the function. The existing recurrence logic remains intact.

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "feat: filter expired schedules from today/tomorrow tabs"
```

---

### Task 3: Expired visual styling in `ScheduleList`

**Files:**
- Modify: `src/components/schedule-list.tsx`

- [ ] **Step 1: Update ScheduleList to use expired status**

Compute `isExpired` inside the component — simpler than prop drilling, it's a cheap pure function.

> **Note on Tamagui 4-state convention:** The card uses RN `Pressable` wrapping a `YStack`. The `YStack` is not an interactive element, so hover/press/disabled states don't apply here. The expired styling (opacity, color, textDecoration) only affects default appearance.

Modify `src/components/schedule-list.tsx`:

Add import at top:
```ts
import { isExpired } from '../utils/schedule-expiration'
```

Inside `renderItem`, before the `return` statement (after the metaParts building), add:
```ts
const expired = isExpired(schedule)
```

Update the title `SizableText` (line 73):
```tsx
<SizableText
  size="$4"
  fontWeight="600"
  numberOfLines={1}
  color={expired ? '$gray8' : undefined}
  textDecorationLine={expired ? 'line-through' : 'none'}
>
  {schedule.title}
</SizableText>
```

Update the meta `SizableText` (line 76):
```tsx
<SizableText
  size="$2"
  color={expired ? '$gray7' : SECONDARY_TEXT}
  marginTop="$1"
  numberOfLines={1}
>
  {metaParts.join(' · ')}
</SizableText>
```

Update the card `YStack` (line 66) — reduce opacity for expired:
```tsx
<YStack
  backgroundColor={getCardColor(index)}
  borderRadius={16}
  paddingHorizontal="$4"
  paddingVertical="$3"
  marginBottom="$2.5"
  opacity={expired ? 0.6 : 1}
>
```

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule-list.tsx
git commit -m "feat: add expired visual styling (strikethrough + gray) in schedule list"
```

---

### Task 4: Final verification

- [ ] **Step 1: Run all tests**

Run: `npx jest`
Expected: All tests PASS

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 3: Manual smoke test** (optional)

Start dev server (`npm start`), verify:
1. Create a one-time schedule for yesterday → should NOT appear in today tab, should appear gray+strikethrough in ALL tab
2. Create a daily recurring schedule with endAt = yesterday → should NOT appear in today tab
3. Create a schedule for today → should appear normally in today tab
