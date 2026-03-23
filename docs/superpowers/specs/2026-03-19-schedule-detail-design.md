# Schedule Detail Page Design

## Summary

Add the ability to tap a schedule item in the list to view and edit its details, reusing the existing `ScheduleDraftForm` component via a new dynamic route.

## Route & Navigation

- New dynamic route: `app/schedule/[id].tsx`
- `ScheduleList` component gains an `onPress` callback; tapping a card calls `router.push(/schedule/${schedule.id})`
- Detail page reads `id` via `useLocalSearchParams()` and loads the Schedule from repository

## Data Loading

- Add `getScheduleById(id: string)` method to `src/features/schedule/repository.ts`
- Detail page calls `repository.getScheduleById(id)` to load the Schedule
- **Not found handling**: if Schedule is not found (deleted or invalid id), show a toast/alert and call `router.back()` to return to the list

## Data Conversion

- Schedule → ScheduleDraft: extract shared fields (title, startAt, endAt, timezone, reminderMinutesBefore, recurrence, notes), set `confidence: 1`, `missingFields: []`
- Pass converted ScheduleDraft as `initialDraft` to `ScheduleDraftForm`
- Note: `ScheduleDraftForm` currently has no endAt input field. If the original Schedule has endAt, it will be preserved on save but not editable in the form. Adding endAt editing is out of scope.

## Form Reuse & Button Text

- `ScheduleDraftForm` (`src/components/schedule-draft-form.tsx`) currently hardcodes button text as `t('schedule.create')`. Add an optional `submitLabel?: string` prop to allow the caller to override the button text.
- Detail page passes `t('common.save')` as `submitLabel` (key already exists in all locale files)
- Existing `DraftScreen` continues to work without changes (submitLabel defaults to `t('schedule.create')`)

## Save Logic

- `app/schedule/[id].tsx` implements its own submit handler (does NOT reuse DraftScreen's `onCreate`):
  1. Merge edited ScheduleDraft fields back onto the original Schedule object (preserving id, createdAt, notificationId)
  2. Update `updatedAt` to current ISO timestamp
  3. If reminderMinutesBefore or startAt changed: call `reminders.updateReminder()` (which handles cancel + re-register internally)
  4. Call `repository.updateSchedule()` to persist
  5. On success: `router.back()` to return to the list (not `dismissAll()`)
- **Concurrent edit edge case**: if `updateSchedule()` silently fails because the schedule was deleted elsewhere, accept this limitation for now

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/schedule/[id].tsx` | Create — detail/edit page with its own submit handler |
| `src/components/schedule-list.tsx` | Modify — add `onPress` callback, make card tappable |
| `src/components/schedule-draft-form.tsx` | Modify — add optional `submitLabel` prop |
| `src/features/schedule/repository.ts` | Modify — add `getScheduleById()` method |
| `app/index.tsx` | Modify — add `onPress` handler that navigates to `/schedule/${id}`, pass to ScheduleList |

## Out of Scope

- Delete from detail page (already available in list)
- Viewing history of changes
- endAt field editing in the form
