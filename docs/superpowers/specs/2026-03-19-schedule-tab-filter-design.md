# Schedule Tab Filter Design

## Overview

Add tab-based filtering to the schedule list page. Users can view schedules by three tabs: Today, Tomorrow, and All. Default tab is Today.

## Decisions

- **Tab style**: Segmented control (iOS-style)
- **Date filtering**: Based on `startAt` field, compared using device local time via dayjs (not the schedule's timezone field)
- **Filter location**: Frontend only, no repository changes
- **Default tab**: Today
- **Empty state**: Tab-specific messages ("今日暂无日程" / "明日暂无日程"), "全部" tab reuses existing `schedule.emptyList`
- **Enum convention**: TypeScript `enum` with uppercase key and value, stored in `src/constants/`

## Pre-requisite Refactor: Recurrence Enum Migration

Migrate existing `RECURRENCE_VALUES` from `as const` array + derived type to TypeScript `enum`.

### Before

```ts
// src/constants/recurrence.ts
export const RECURRENCE_VALUES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;

// src/types/schedule.ts
import { RECURRENCE_VALUES } from '../constants';
export type Recurrence = (typeof RECURRENCE_VALUES)[number];
```

### After

```ts
// src/constants/recurrence.ts
export enum Recurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
```

### Affected files and specific changes

- `src/constants/recurrence.ts` — rewrite to enum
- `src/constants/index.ts` — export `Recurrence` enum instead of `RECURRENCE_VALUES`
- `src/types/schedule.ts` — remove `RECURRENCE_VALUES` import and `Recurrence` type derivation; import `Recurrence` enum from constants and re-export
- `src/types/index.ts` — keep re-exporting `Recurrence` (source changes to enum)
- `src/features/schedule/validation.ts` — replace `RECURRENCE_VALUES.includes()` with `Object.values(Recurrence).includes()`; import `Recurrence` enum from constants
- `src/features/schedule/normalizer.ts` — replace string literals (`'DAILY'`, `'WEEKLY'`, `'MONTHLY'`, `'NONE'`) with enum members (`Recurrence.DAILY`, etc.); import `Recurrence` from constants
- `src/lib/date-time.ts` — replace string literals (`'DAILY'`, `'WEEKLY'`, `'MONTHLY'`) with enum members (`Recurrence.DAILY`, etc.); import `Recurrence` from constants

## New Enum: ScheduleTab

```ts
// src/constants/schedule-tab.ts
export enum ScheduleTab {
  TODAY = 'TODAY',
  TOMORROW = 'TOMORROW',
  ALL = 'ALL',
}
```

Exported via `src/constants/index.ts`.

## Date Filtering Logic

In `app/index.tsx`, filter the loaded `items` array based on current tab:

```ts
import dayjs from 'dayjs'

function filterSchedules(schedules: Schedule[], tab: ScheduleTab): Schedule[] {
  if (tab === ScheduleTab.ALL) return schedules
  const target = tab === ScheduleTab.TODAY ? dayjs() : dayjs().add(1, 'day')
  return schedules.filter((s) => dayjs(s.startAt).isSame(target, 'day'))
}
```

## UI: Segmented Control

Implemented in `app/index.tsx` using Tamagui `XStack` + `Button`:

- Container: `XStack` with `borderRadius`, `borderWidth`, `borderColor`, `overflow: hidden`
- Each tab: `Button` with conditional background/text color based on active state
- State: `useState<ScheduleTab>(ScheduleTab.TODAY)`
- Position: Between header and schedule list. Tab control is always visible (even during loading/error), only the list area below changes

## ScheduleList Component Change

`src/components/schedule-list.tsx` receives an optional `emptyMessage` prop to display tab-specific empty state text. Falls back to existing `t('schedule.emptyList')` if not provided.

## i18n Additions

New keys in en, zh, zh-TW:

| Key | en | zh | zh-TW |
|-----|----|----|-------|
| `schedule.tabToday` | Today | 今日 | 今日 |
| `schedule.tabTomorrow` | Tomorrow | 明日 | 明日 |
| `schedule.tabAll` | All | 全部 | 全部 |
| `schedule.emptyToday` | No schedules today | 今日暂无日程 | 今日暫無日程 |
| `schedule.emptyTomorrow` | No schedules tomorrow | 明日暂无日程 | 明日暫無日程 |

## File Change Summary

| File | Change |
|------|--------|
| `package.json` | Add `dayjs` dependency |
| `src/constants/recurrence.ts` | Rewrite to `enum Recurrence` |
| `src/constants/schedule-tab.ts` | New file: `enum ScheduleTab` |
| `src/constants/index.ts` | Export `ScheduleTab`, update `Recurrence` export |
| `src/types/schedule.ts` | Remove `Recurrence` type derivation, import enum |
| `src/types/index.ts` | Update `Recurrence` re-export source |
| `src/features/schedule/validation.ts` | Replace `RECURRENCE_VALUES.includes()` with `Object.values(Recurrence).includes()` |
| `src/features/schedule/normalizer.ts` | Replace string literals with `Recurrence` enum members |
| `src/lib/date-time.ts` | Replace string literals with `Recurrence` enum members |
| `src/i18n/locales/en.json` | Add tab and empty state keys |
| `src/i18n/locales/zh.json` | Add tab and empty state keys |
| `src/i18n/locales/zh-TW.json` | Add tab and empty state keys |
| `src/components/schedule-list.tsx` | Add optional `emptyMessage` prop |
| `app/index.tsx` | Add tab state, segmented control UI, dayjs filtering |

## Testing

- `filterSchedules` pure function: unit tests covering today/tomorrow/all filtering, edge cases (empty array, no matches)
- `ScheduleList` component: test `emptyMessage` prop renders correctly
- Recurrence enum migration: update existing tests in `__tests__/normalizer.test.ts`, `__tests__/validation.test.ts` to use enum members instead of string literals
- Tab interaction: test that switching tabs renders the correct filtered list

## What Does NOT Change

- Repository layer (`src/features/schedule/repository.ts`)
- Route structure
- `Schedule` type fields
