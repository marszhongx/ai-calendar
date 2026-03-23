# Page Restructure Design

## Overview

Restructure the app so the home page is the schedule list, with a FAB for creating new schedules. The three-step flow becomes: List (home) → New (input) → Draft (confirm & create) → back to List (stack cleared).

## Navigation Flow

```
index(List) --FAB--> /new --submit--> /draft --create success--> dismissAll back to index
index(List) --settings icon--> /config
```

Non-home pages get automatic back arrows via the system header.

## File Changes

| File | Before | After |
|------|--------|-------|
| `app/index.tsx` | Message input page | Schedule list page (home) |
| `app/new.tsx` | Does not exist | New schedule page (message input) |
| `app/draft.tsx` | Draft confirmation | Draft confirmation (change navigation) |
| `app/config.tsx` | AI config | AI config (unchanged, header provided by system) |
| `app/schedules.tsx` | Schedule list | Delete (logic moved to index.tsx) |
| `src/constants.ts` | Does not exist | Shared constants (`PENDING_DRAFT_KEY`) |

## Layout & Header

`_layout.tsx`: Change `screenOptions` from `{ headerShown: false }` to `{ headerShown: true }`. Each page sets its own title inline using `<Stack.Screen options={{ title: ... }} />` at the top of its JSX return (Expo Router dynamic route options pattern).

All pages: Remove `SafeAreaView` wrapper. The system header handles the top safe area, and the Stack navigator handles the rest. If bottom safe area is needed, use `SafeAreaView` with only `edges={['bottom']}`.

## Page Details

### index.tsx (Schedule List / Home)

- Header: title `t('schedule.scheduleList')`, right side settings icon via `headerRight` option. Use Tamagui `Button` with text "⚙" (or unicode gear character) as the settings button, no icon library needed. Links to `/config`.
- Body: `ScheduleList` component with delete support (logic moved from `schedules.tsx` as-is, including Alert-based delete confirmation and error state handling)
- Loading state: Show `Spinner` while `listSchedules` is loading (same pattern as current `schedules.tsx`)
- Error state: Show error text on load failure (migrated from current `schedules.tsx` line 68-70)
- FAB: Tamagui `Button` with "+" text, circular, absolute positioned at bottom-right (bottom: 24, right: 24, size: 56), navigates to `/new` via `router.push`. Floats above content on scroll via absolute positioning within the page container.
- Empty state hint when no schedules exist
- List refresh: Use `useFocusEffect` from `@react-navigation/native` to reload schedules from the repository whenever the page gains focus. The callback should handle cleanup to avoid setting state on unmounted component.
- Props: Accept optional `schedules` prop for test injection (same pattern as current `schedules.tsx`)

### new.tsx (New Schedule)

- Header title: `t('schedule.newSchedule')`
- Body: `MessageInputForm` component (handles its own loading/submitting state internally)
- On submit: AI parses message, stores draft in AsyncStorage (`PENDING_DRAFT_KEY` from `src/constants.ts`), then `router.push('/draft')`
- Error handling: display error message on parse failure (same pattern as current `index.tsx`)
- Migrate `getErrorMessage` helper and `defaultSubmit` function from current `index.tsx`
- Props: Accept optional `onSubmit?(message: string): Promise<ScheduleDraft>` prop for test injection (same interface as current `IndexScreen`)

### draft.tsx (Confirm & Create)

- Header title: `t('schedule.saveDraft')`
- Body: `ScheduleDraftForm` component with validation
- Remove: the "Schedule List" button (current line 119) and the "Published" success text (current line 128-129), as they are no longer needed. Also remove the `createdSchedule` state variable.
- On create success: `router.dismissAll()` to clear the entire stack and return to home
- On create failure: show error message, user stays on draft page and can retry or press system back arrow to return to new page (standard stack behavior, back arrow goes to /new)
- Update import: `PENDING_DRAFT_KEY` from `src/constants.ts` instead of `./index`

### config.tsx (Settings)

- Header title: `t('ai_config.title')`
- Body: `AIConfigForm` component, unchanged
- Remove `SafeAreaView` wrapper

## Data Flow

### new → draft

Existing pattern: AsyncStorage with `PENDING_DRAFT_KEY`. Constant extracted to `src/constants.ts` to avoid cross-page import dependency. New page writes, draft page reads and clears on mount.

### Stack Management

`router.dismissAll()` returns to the first screen (index) and removes all intermediate screens (new, draft) from the stack. Users cannot navigate back to new or draft after creation.

### List Refresh

Use `useFocusEffect` to reload the schedule list whenever index gains focus. This handles both the `dismissAll` return case and the case where the user navigates back from other pages. The index component stays mounted at the stack bottom, so `useEffect` alone would not re-trigger.

## i18n

Existing keys to reuse:
- `schedule.scheduleList` — index header title
- `schedule.newSchedule` — new page header title
- `schedule.saveDraft` — draft page header title
- `ai_config.title` — config page header title

No new i18n keys required.

## Test Impact

### Modify: `app/__tests__/input-to-draft-flow.test.tsx`

- Rename test subject from `IndexScreen` to `NewScheduleScreen`
- Update import from `../index` to `../new`
- Update `router.push` assertion path if needed
- Add mock for `router.dismissAll`
- Rewrite the "creates a schedule and renders it in the list screen" test (current lines 164-232): this test currently asserts `Published` text appears and renders `SchedulesScreen` inline, both of which no longer apply. Replace with: assert `router.dismissAll()` is called after successful creation.

### Delete or update references

- Any test importing from `app/schedules.tsx` needs to import from `app/index.tsx` instead
- `SchedulesScreen` component references become the new `IndexScreen`

### New test considerations

- Test FAB navigation: pressing FAB calls `router.push('/new')`
- Test `useFocusEffect` refresh behavior on index
- Test `dismissAll` is called on successful schedule creation in draft

## Dependencies

- Expo Router 55.0.6: `router.dismissAll()` supported since Expo Router 3.5 / SDK 51
- `@react-navigation/native`: `useFocusEffect` (already available as a transitive dependency of expo-router)
- No new packages required
