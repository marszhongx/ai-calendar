# Schedule Expiration Design

## Problem

The app's today/tomorrow tabs don't consider `endAt` when filtering schedules. A recurring DAILY event with an `endAt` in the past still appears every day. Non-recurring events with no `endAt` also linger after their date passes. There's no visual distinction for expired items in the ALL tab.

## Requirements

1. **Expiration rule**: A schedule is expired when the current date is strictly after the expiration boundary day.
   - If `endAt` exists: boundary = day of `endAt`
   - If no `endAt`: boundary = day of `startAt`
   - Applies uniformly to both recurring and non-recurring schedules.

2. **Today/Tomorrow tabs**: Expired schedules must not appear.

3. **ALL tab**: Expired schedules remain visible but with visual markers — title strikethrough and gray color. Sort order (by creation time, newest first) is unchanged.

## Design

### New utility: `isExpired(schedule, referenceDate?)`

Location: `src/utils/schedule-expiration.ts`

A pure function with an optional `referenceDate` parameter (defaults to today) for testability.

```
isExpired(schedule, referenceDate?):
  boundary = schedule.endAt ?? schedule.startAt
  return referenceDate is strictly after the day of boundary
```

"Strictly after" means: if boundary is 2026-03-25 (any time), then 2026-03-25 is NOT expired, but 2026-03-26 IS expired.

### Changes to `occursOnDay()` in `app/index.tsx`

Add an early return at the top of `occursOnDay()`:

```
if isExpired(schedule, target) → return false
```

This prevents expired schedules from appearing in today/tomorrow tabs. The existing recurrence logic remains unchanged.

### Changes to `schedule-list.tsx`

The component receives schedule data and renders list items. Changes:

- Call `isExpired(schedule)` for each item
- If expired: apply `textDecorationLine: 'line-through'` to title, reduce opacity or use gray color for the entire card
- Must handle all 4 Tamagui states (default, hover, press, disabled) per project conventions

## Files Changed

| File | Change |
|------|--------|
| `src/utils/schedule-expiration.ts` | New file: `isExpired()` pure function |
| `app/index.tsx` | Import `isExpired`, add early return in `occursOnDay()` |
| `src/components/schedule-list.tsx` | Import `isExpired`, add expired visual styling |
| `src/utils/__tests__/schedule-expiration.test.ts` | Tests for `isExpired()` |
| `app/__tests__/index.test.tsx` | Tests for updated `occursOnDay()` filtering |

## Edge Cases

- `endAt` earlier than `startAt`: treated as expired once past `endAt` day (no special handling needed, the rule applies naturally)
- Missing both `endAt` and `startAt`: impossible per types (`startAt` is required)
- Timezone: dayjs uses local timezone consistently, matching existing behavior
