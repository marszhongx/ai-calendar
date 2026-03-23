# Security, UX & Code Quality Improvements

**Date**: 2026-03-23
**Status**: Approved

## A. Security & Reliability

### A1: Device Ownership via X-Device-Id Header

**Client** (`services/index.ts`): `request()` attaches `X-Device-Id` header automatically. Remove `deviceId` from request bodies.

**Server** (`lib/device-id.ts`): New helper `getDeviceId(request: Request): string | null` extracts header.

Route changes:
- `GET /api/schedules`: deviceId from header (remove query param)
- `POST /api/schedules`: deviceId from header (remove from body)
- `PUT /api/schedules/[id]`: query schedule's deviceId, compare with header, 403 if mismatch
- `DELETE /api/schedules/[id]`: same ownership check
- `POST /api/devices`: deviceId from header (remove from body)
- `POST /api/parse`: deviceId from header (remove from body)

### A2: API Input Validation

All POST/PUT routes: wrap `request.json()` in try-catch, return 400 on parse failure.

Field validations:
- `title`: required, max 200 chars
- `notes`: max 2000 chars
- `startAt`/`endAt`: validate `new Date()` produces valid date (`!isNaN`)
- `endAt > startAt` when both present
- `reminderMinutesBefore`: integer, 0-1440
- `recurrence`: must be one of NONE, DAILY, WEEKLY, MONTHLY
- `message` (parse route): required, max 5000 chars

### A3: Cron Race Condition Fix

Before sending push notifications, atomically update `reminderSentAt = NOW()` with a WHERE clause that includes the old `reminderSentAt` value (optimistic lock). Only send pushes for rows that were successfully updated. This prevents duplicate sends from concurrent cron executions.

Flow:
1. Query eligible reminders (same as now)
2. UPDATE ... SET reminderSentAt = NOW() WHERE id IN (...) AND (reminderSentAt IS NULL OR reminderSentAt = <old_value>) RETURNING id
3. Send push only for returned IDs
4. No second update needed

### A4: Recurring Reminder Drift Fix

Replace interval-based logic with time-of-day matching:

For DAILY/WEEKLY/MONTHLY recurring schedules:
1. Extract hour and minute from `start_at`
2. Compute reminder target: `(hour * 60 + minute) - reminder_minutes_before`
3. Check if current time-of-day is within 1-minute window of target
4. For WEEKLY: also check day-of-week matches `start_at`
5. For MONTHLY: also check day-of-month matches `start_at`
6. Use `reminder_sent_at` to check already-sent-today/this-week/this-month (date comparison, not interval)

### A5: Push Failure Retry

Modify `sendPushNotifications` to return `{ succeeded: string[], failed: string[] }` (push tokens).

In cron route: only update `reminderSentAt` for schedules whose pushToken is in the succeeded list. Failed schedules keep their old `reminderSentAt`, so next cron run will retry them.

## B. UX Enhancements

### B1: End Time Picker (Always Visible)

In `schedule-draft-form.tsx`, add a second `DateTimePickerField` for `endAt` inside the same FormSection as startAt. Label: `t('schedule.endTime')`. Value defaults to empty/undefined.

### B2: Localized Validation Errors

`validateDraft` returns i18n keys instead of English strings:
- `validation.titleRequired`
- `validation.startAtRequired`
- `validation.invalidRecurrence`
- `validation.reminderRange`

Callers translate with `t()` before displaying. Add translations to all 3 locale files (en, zh, zh-TW).

### B3: Retry Button on Load Failure

In `index.tsx`, when `error` is set, show a retry `PillButton` alongside the error text. On press, re-invoke the fetch logic.

### B4: Reminder Minutes Constraint

Client: clamp value to 0-1440 in `onChangeText`. Validation in `validateDraft` adds `validation.reminderRange` error.

Server: A2 covers server-side validation.

### B5: Low Confidence Warning

In `draft.tsx`, when `draft.confidence < 0.6`, show a warning banner above the form: `t('validation.lowConfidence')`. Non-blocking, informational only.

## D. Code Quality

### D1: Unified Draft/Schedule Conversion

Move `scheduleToDraft()` from `schedule/[id].tsx` into `schedule-normalizer.ts`.

Add `draftToPayload(draft: ScheduleDraft): SchedulePayload` to `schedule-normalizer.ts`. Used by `draft.tsx` and `schedule/[id].tsx` for submit.

### D2: Remove Unsafe Type Assertions

- `listSchedules`: typed as `request<Schedule[]>(...)`, remove `as Schedule[]` casts
- `createSchedule`: typed as `request<Schedule>(...)`, remove `as unknown as Schedule`
- `updateSchedule`: typed as `request<Schedule>(...)`

### D3: Strong-Typed API Service Layer

New type in `types/schedule.ts`:
```ts
type SchedulePayload = {
  title: string
  startAt: string
  endAt?: string
  reminderMinutesBefore: number
  recurrence: string
  notes: string
  originalMessage?: string
}
```

`createSchedule(data: SchedulePayload)` and `updateSchedule(id: string, data: Omit<SchedulePayload, 'originalMessage'>)`.

### D4: Error Boundary

New `client/src/components/error-boundary.tsx`: React class component (RN requirement). Catches child tree exceptions, shows friendly error screen with retry button. Wrapped at root in `_layout.tsx`.
