# UI/UX & Code Polish Design Spec

**Date:** 2026-03-22
**Approach:** Design-system-first, then apply to all pages
**Target:** iOS primary, others compatible
**Style:** Clean, restrained, Apple-inspired with subtle color

---

## 1. Design System

### 1.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `ACCENT_COLOR` | `#E8725C` | Primary actions, selected pill, FAB |
| `ACCENT_COLOR_PRESSED` | `#D4634E` | Press state for accent elements |
| `PAGE_BACKGROUND` | `#FAFAFA` | All page backgrounds (replaces `#FFF8F6`) |
| `PILL_UNSELECTED_BG` | `#F3F4F6` | Unselected pill/chip fill (replaces transparent+border) |
| `LABEL_COLOR` | `#9CA3AF` | Form labels, secondary text (replaces coral labels) |
| `SECONDARY_TEXT` | `#6B7280` | Card meta info text (replaces hardcoded `#666666`) |

Card background colors (low-saturation pastels, 5-color cycle):

| Index | Value | Tone |
|-------|-------|------|
| 0 | `#FEF2F0` | Warm pink |
| 1 | `#FFF5EB` | Warm orange |
| 2 | `#F0F5F2` | Sage green |
| 3 | `#EFF1FE` | Soft blue |
| 4 | `#F5F0F9` | Soft purple |

These replace the current 8-color `CARD_COLORS` and `CARD_PROGRESS_COLORS` arrays. Progress bars are removed entirely.

### 1.2 Public Components

#### AccentButton

Unified primary action button with all four states. Inherits all Tamagui `Button` props (including `circular`, `size`, etc.).

```
Props: inherits Tamagui Button props (size, onPress, disabled, circular, children, etc.)
Styles:
  - default: backgroundColor=ACCENT_COLOR, borderRadius=12
  - hoverStyle: backgroundColor=ACCENT_COLOR
  - pressStyle: backgroundColor=ACCENT_COLOR_PRESSED
  - disabledStyle: backgroundColor=ACCENT_COLOR, opacity=0.5
  - text: white, fontWeight=600

Note: When circular=true (used for FAB), borderRadius is automatically handled by Tamagui.
```

Used in: message-input-form submit, schedule-draft-form submit, FAB (with `circular` prop + `elevation="$4"` for shadow, passed through as Tamagui Button props).

#### PillButton

Pill-shaped selection button for tabs and option groups.

```
Props: selected: boolean, onPress, disabled, children
Styles (all four states for each variant):

  Selected:
    - default: backgroundColor=ACCENT_COLOR, text=white, borderRadius=20
    - hoverStyle: backgroundColor=ACCENT_COLOR
    - pressStyle: backgroundColor=ACCENT_COLOR_PRESSED
    - disabledStyle: backgroundColor=ACCENT_COLOR, opacity=0.5

  Unselected:
    - default: backgroundColor=PILL_UNSELECTED_BG (#F3F4F6), text=SECONDARY_TEXT (#6B7280), borderRadius=20, borderWidth=0
    - hoverStyle: backgroundColor=#E5E7EB
    - pressStyle: backgroundColor=#D1D5DB
    - disabledStyle: backgroundColor=PILL_UNSELECTED_BG, opacity=0.5
```

Used in: index.tsx tab filter, schedule-draft-form recurrence options.

#### FormSection

White card container for form field groups. Already exists in schedule-draft-form but kept as local component. Ensure consistent usage.

```
Props: children
Styles:
  - backgroundColor=white, borderRadius=16, paddingHorizontal=$4, paddingVertical=$3, gap=$3
```

Label style within FormSection changes from `color=ACCENT_COLOR` to `color=LABEL_COLOR, fontSize=$2, fontWeight=500`.

#### EmptyState

Centered empty state with icon and guidance text. Uses emoji text for icons (acceptable cross-platform since all target platforms render emoji natively; no icon library needed).

```
Props: icon: string (emoji), iconBg?: string (circle bg color), title: string, subtitle?: string
Layout:
  - Centered vertically in parent (flex=1, justifyContent=center, alignItems=center)
  - Circle background (80x80, borderRadius=40, backgroundColor=iconBg) containing emoji (fontSize=36)
  - Title: fontWeight=600, size=$4, color=#111, marginTop=$3
  - Subtitle: size=$3, color=LABEL_COLOR, marginTop=$1, textAlign=center
```

Instances:
- Today tab: icon=☀️, iconBg=#FEF2F0, title=t('schedule.emptyToday'), subtitle=t('schedule.emptyTodayHint')
- Tomorrow tab: icon=🌙, iconBg=#EFF1FE, title=t('schedule.emptyTomorrow'), subtitle=t('schedule.emptyTomorrowHint')
- All tab: icon=📋, iconBg=#F0F5F2, title=t('schedule.emptyList'), subtitle=t('schedule.emptyListHint')
- Not found: icon=🔍, iconBg=#F3F4F6, title=t('schedule.notFound')

#### SkeletonCard

Pulsing placeholder card for loading states. Uses React Native `Animated` API for pulse animation (no additional dependencies needed).

```
Props: count?: number (default 3)
Layout:
  - Each card: backgroundColor=#F3F4F6, borderRadius=16, padding=14px 16px (matches real card borderRadius)
  - Inside: two rounded rectangles (title line 60% width 16px height, meta line 40% width 12px height)
  - Pulse animation via Animated.loop + Animated.timing: opacity 1 → 0.5 → 1, duration=1500ms
  - Staggered start: each card begins animation 200ms after previous
  - Cards spaced with marginBottom=$2.5 (matching real card spacing)
```

### 1.3 Shared Hook: useDeviceId

```typescript
function useDeviceId(): { deviceId: string | null; loading: boolean }
```

Reads `deviceId` from AsyncStorage once on mount via `useEffect`. Caches the value in state — subsequent renders return the cached value immediately. This hook provides the deviceId but does not handle API calls. Pages that need to refetch on focus (like index.tsx) should use the hook's `deviceId` value inside their own `useFocusEffect` callback:

```typescript
const { deviceId, loading: deviceLoading } = useDeviceId()

useFocusEffect(useCallback(() => {
  if (!deviceId) return
  // fetch schedules using deviceId...
}, [deviceId]))
```

Location: `client/src/hooks/useDeviceId.ts`

### 1.4 Shared Utilities: lib/date-format.ts

Consolidate all date/time formatting functions:

```typescript
export function formatDate(isoString: string, locale?: string): string
export function formatTime(isoString: string, locale?: string): string
export function formatDatePart(isoString: string, locale?: string): string
export function formatTimePart(isoString: string, locale?: string): string
export function toDatetimeLocalValue(isoString: string): string
```

Currently duplicated across schedule-list.tsx and date-time-picker.tsx.

---

## 2. Page Changes

### 2.1 Index Page (index.tsx)

- Page background: `PAGE_BACKGROUND` (#FAFAFA)
- Tab buttons: replace inline Button with `PillButton` component
- Loading state: replace `Spinner` with `SkeletonCard`
- Empty state: replace plain text with `EmptyState` (different icon per tab)
- FAB: use `AccentButton` with `circular` prop (inherits from Tamagui Button)

### 2.2 Schedule List (schedule-list.tsx)

- Card backgrounds: replace 8-color arrays with 5-color low-saturation pastels
- Remove time progress bar entirely (View with width percentage + progress colors)
- Remove `getTimeProgress()` function
- Remove `CARD_PROGRESS_COLORS` from constants
- Remove `useEffect` tick interval (was for progress bar updates)
- Card layout: two-line compact format:
  - Line 1: title (fontWeight=600, size=$4)
  - Line 2: time range + recurrence badge + reminder badge (size=$2, color=SECONDARY_TEXT)
  - Time format: "14:00" or "14:00 – 15:00" if endAt exists
  - **Date display**: on TODAY/TOMORROW tabs, show only time. On ALL tab, prepend date: "Mar 22 · 14:00" using `formatDate` from shared lib
  - Recurrence: show only if not NONE, format as text like "每周" / "Weekly"
  - Reminder: show only if > 0, format as "🔔 30min"
- Replace hardcoded `#666666` with `SECONDARY_TEXT` token
- Use shared `formatDate` / `formatTime` from lib/date-format.ts
- Card needs `recurrence`, `reminderMinutesBefore`, `endAt` data — already available on Schedule type
- New prop: `showDate?: boolean` — controls whether date is shown on meta line. Index page passes `showDate={activeTab === ScheduleTab.ALL}`
- ScheduleList keeps its empty state rendering (`emptyMessage` prop retained). EmptyState is used by the parent index.tsx to replace the existing simple text, passing through as `emptyMessage` is removed and the parent handles empty rendering directly when `schedules.length === 0`. ScheduleList's internal empty check is removed — the parent decides what to show when empty

### 2.3 New Page (new.tsx + message-input-form.tsx)

- Page background: `PAGE_BACKGROUND`
- Submit button: use `AccentButton`
- Error display: add error icon + light red background container instead of plain red text
  - Container: backgroundColor=#FEF2F2, borderRadius=12, padding=$3
  - Layout: XStack with ⚠️ emoji + text
  - Text: color=#DC2626, size=$3

### 2.4 Draft Page (draft.tsx + schedule-draft-form.tsx)

- Page background: `PAGE_BACKGROUND`
- FormSection: keep independent card style (not grouped)
- Form labels: `color` changes from `ACCENT_COLOR` to `LABEL_COLOR` (#9CA3AF), `fontWeight=500`
- Recurrence pills: use `PillButton` (unselected = gray fill, no border)
- Reminder unit: reuse existing `schedule.minutes` i18n key (en: "minutes", zh/zh-TW already defined)
- Submit button: use `AccentButton`
- Error display: same improved style as new page
- Loading state: `Spinner` → `SkeletonCard`

### 2.5 Detail Page (schedule/[id].tsx)

- Inherits all ScheduleDraftForm improvements automatically
- Loading state: `Spinner` → `SkeletonCard`
- Not found state: use `EmptyState` (icon=🔍)

### 2.6 DateTimePicker (date-time-picker.tsx)

- Replace hardcoded Chinese strings in iOS modal with i18n keys:
  - `"取消"` → `t('picker.cancel')`
  - `"选择日期"` → `t('picker.selectDate')`
  - `"选择时间"` → `t('picker.selectTime')`
  - `"下一步"` → `t('picker.next')`
  - `"确定"` → `t('picker.confirm')`
- Import `useLocale` and call `t()` for all picker text
- Replace `formatDatePart` / `formatTimePart` / `toDatetimeLocalValue` with imports from `lib/date-format.ts`
- Web input: keep HTML `<input>` element with inline styles (Tamagui tokens cannot apply to raw HTML elements). Move hardcoded color values to constants: `#e0e0e0` → `$borderColor`, `#FFF0ED` → `PILL_UNSELECTED_BG`, `#1a1a1a` → keep as-is (standard text color)

---

## 3. i18n Additions

New keys for all three locales (en, zh, zh-TW). Files located at `client/src/i18n/locales/`.

| Key | en | zh | zh-TW |
|-----|----|----|-------|
| `schedule.emptyTodayHint` | Tap + to create with natural language | 点击 + 用自然语言创建日程 | 點擊 + 用自然語言建立日程 |
| `schedule.emptyTomorrowHint` | No plans yet for tomorrow | 明天暂无安排 | 明天暫無安排 |
| `schedule.emptyListHint` | Tap + to get started | 点击 + 开始创建 | 點擊 + 開始建立 |
| `schedule.notFound` | Schedule not found | 未找到该日程 | 未找到該日程 |
| `picker.cancel` | Cancel | 取消 | 取消 |
| `picker.selectDate` | Select Date | 选择日期 | 選擇日期 |
| `picker.selectTime` | Select Time | 选择时间 | 選擇時間 |
| `picker.next` | Next | 下一步 | 下一步 |
| `picker.confirm` | Done | 确定 | 確定 |

Note: Reminder unit reuses existing `schedule.minutes` key — no new key needed.

---

## 4. Code Cleanup

- Delete `client/src/components/form-field.tsx` (unused)
- Remove `CARD_PROGRESS_COLORS` from `client/src/constants/index.ts`
- Replace 8-color `CARD_COLORS` with 5-color low-saturation array
- Add new color tokens: `PAGE_BACKGROUND` update, `PILL_UNSELECTED_BG`, `LABEL_COLOR`, `SECONDARY_TEXT`
- Move date formatting functions to `client/src/lib/date-format.ts`
- DateTimePicker iOS modal: replace hardcoded Chinese strings with i18n keys (see Section 2.6)
- DateTimePicker web: move hardcoded color values to constants where possible, keep inline styles on HTML `<input>` (see Section 2.6)
- Extract `useDeviceId` hook to `client/src/hooks/useDeviceId.ts`
- Update existing tests to match new component structure and imports
- New component tests are deferred — existing test coverage is maintained by updating imports and assertions, but dedicated test files for new components (AccentButton, PillButton, EmptyState, SkeletonCard, useDeviceId, date-format) are out of scope for this iteration

---

## 5. Files Affected

### New files
- `client/src/components/accent-button.tsx`
- `client/src/components/pill-button.tsx`
- `client/src/components/empty-state.tsx`
- `client/src/components/skeleton-card.tsx`
- `client/src/hooks/useDeviceId.ts`
- `client/src/lib/date-format.ts`

### Modified files
- `client/src/constants/index.ts` — color tokens update, remove CARD_PROGRESS_COLORS, replace CARD_COLORS
- `client/src/components/schedule-list.tsx` — card redesign, remove progress bar, add showDate prop
- `client/src/components/schedule-draft-form.tsx` — label color, PillButton, AccentButton
- `client/src/components/message-input-form.tsx` — AccentButton, error style
- `client/src/components/date-time-picker.tsx` — i18n keys, shared formatters, web input colors
- `client/app/index.tsx` — PillButton, SkeletonCard, EmptyState, background, useDeviceId
- `client/app/new.tsx` — background, useDeviceId
- `client/app/draft.tsx` — background, SkeletonCard, useDeviceId
- `client/app/schedule/[id].tsx` — SkeletonCard, EmptyState, useDeviceId
- `client/src/i18n/locales/en.json` — new keys
- `client/src/i18n/locales/zh.json` — new keys
- `client/src/i18n/locales/zh-TW.json` — new keys

### Deleted files
- `client/src/components/form-field.tsx`
