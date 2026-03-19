# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run server         # Start server (Next.js, port 3001)
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on Web (React Native Web)
npm test               # Run all tests (Jest)
npm test -- --testPathPattern=<pattern>  # Run specific test file
npm run typecheck      # TypeScript type check
cd server && npm test  # Run server tests (Vitest)
cd server && npm run typecheck  # Server type check
```

## Architecture

Monorepo: cross-platform Expo client + Next.js backend API. Users describe events in natural language, server AI parses them into structured schedules, client confirms and saves, server sends push reminders via cron.

### Client Pages

- `app/index.tsx` — Schedule list (tab filter: today/tomorrow/all)
- `app/new.tsx` — Natural language input
- `app/draft.tsx` — Draft confirmation & editing
- `app/schedule/[id].tsx` — Schedule detail & edit
- `app/_layout.tsx` — Root layout, device registration & push token upload on startup

### Client Layers

- **API Client** (`src/services/index.ts`): Unified fetch-based client. All server calls go through here (`registerDevice`, `parseMessage`, `listSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule`).
- **UI**: Tamagui 2.0-rc components and theming. Pages in `app/`, reusable components in `src/components/`.
- **Routing**: Expo Router (file-based routing in `app/`).
- **Normalizer** (`src/utils/schedule-normalizer.ts`): Transforms server `ParsedSchedulePayload` (snake_case) into client `ScheduleDraft` (camelCase).
- **Validation** (`src/utils/schedule-validation.ts`): Pre-submission client-side validation.
- **i18n** (`src/i18n/`): i18n-js + expo-localization. Supports en, zh, zh-TW. LocaleContext in `src/context/`.
- **Types** (`src/types/`): ScheduleDraft (editable), Schedule (persisted), ParsedSchedulePayload (server response).

### Server (`server/`)

- **API Routes** (`server/app/api/`):
  - `devices/route.ts` — POST: register device & push token
  - `parse/route.ts` — POST: AI parse natural language → structured schedule
  - `schedules/route.ts` — GET (list by deviceId), POST (create)
  - `schedules/[id]/route.ts` — PUT (update), DELETE (delete)
  - `cron/send-reminders/route.ts` — POST: cron-triggered push notification sender
- **Libs** (`server/lib/`): `db.ts` (Vercel Postgres), `ai.ts` (AI SDK / OpenAI-compatible), `expo-push.ts` (Expo Push SDK)
- **Database**: Vercel Postgres (Neon). Tables: `devices` (id, push_token, platform), `schedules` (id, device_id, title, start_at, end_at, timezone, reminder_minutes_before, recurrence, notes, reminder_sent_at).
- **Migration**: `server/scripts/migrate.ts` — run with `cd server && npm run migrate`

### Device Identity

No user accounts. Each device generates a UUID on first launch, stored in AsyncStorage. Push token uploaded to `POST /api/devices` on startup.

### Reminder Flow

Server cron (`/api/cron/send-reminders`) runs every minute. Queries schedules where `start_at - reminder_minutes_before` is due. Handles single and recurring (DAILY/WEEKLY/MONTHLY) via `reminder_sent_at` tracking. Sends Expo Push notifications in batch.

### Patterns

- No global state library; page-level useState + business logic functions
- Result type (`src/lib/result.ts`) for error handling
- Enums use TypeScript `enum` in `src/constants/index.ts`（不单独文件），key 和 value 均为全大写形式（如 `enum ScheduleTab { TODAY = 'TODAY' }`）。所有新增枚举必须遵循此模式。

## Tech Stack

**Client**: Expo 55, React Native 0.83, React 19, Tamagui 2.0-rc, Expo Router, i18n-js, TypeScript 5.9, Jest 29 + jest-expo + Testing Library, Babel with Tamagui plugin.

**Server**: Next.js 15, Vercel Postgres, ai SDK v6 + @ai-sdk/openai, Zod 4, expo-server-sdk, TypeScript 5.9, Vitest.

## Testing

**Client**: Jest config at `jest.config.js`, setup at `jest.setup.ts` (mocks AsyncStorage, expo-notifications, tamagui.config). Tests colocated in `__tests__/` directories.

**Server**: Vitest. Route tests mock `@vercel/postgres`. Tests colocated next to route files.
