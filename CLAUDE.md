# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server (port 4398)
npm run server         # Start server (Next.js, port 4399)
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on Web (React Native Web)
npm test               # Run client tests (Jest)
npm run test:server    # Run server tests (Vitest)
npm run test:all       # Run all tests
npm run typecheck         # All workspaces type check
npm run typecheck:client  # Client TypeScript type check
npm run typecheck:server  # Server TypeScript type check
npm run lint              # Biome lint + format check (all workspaces)
npm run lint:client       # Client only lint
npm run lint:server       # Server only lint
cd server && npm run migrate  # Run DB migration
```

完成代码修改后，必须同时通过 typecheck 和 lint 两项检查：

```bash
npm run typecheck && npm run lint
```

## Architecture

Monorepo (npm workspaces): cross-platform Expo client (`client/`) + Next.js backend API (`server/`). Users describe events in natural language, server AI parses them into structured schedules, client confirms and saves, server sends push reminders via cron.

### Client Pages (`client/app/`)

- `index.tsx` — Schedule list (tab filter: today/tomorrow/all)
- `new.tsx` — Natural language input
- `draft.tsx` — Draft confirmation & editing
- `schedule/[id].tsx` — Schedule detail & edit
- `_layout.tsx` — Root layout, device registration & push token upload on startup

### Client Layers (`client/src/`)

- **API Client** (`services/index.ts`): Unified fetch-based client. All server calls go through here (`registerDevice`, `parseMessage`, `listSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule`).
- **UI**: Tamagui 2.0-rc components and theming. Pages in `client/app/`, reusable components in `client/src/components/`.
- **Routing**: Expo Router (file-based routing in `client/app/`).
- **Normalizer** (`utils/schedule-normalizer.ts`): Transforms server `ParsedSchedulePayload` (snake_case) into client `ScheduleDraft` (camelCase).
- **Validation** (`utils/schedule-validation.ts`): Pre-submission client-side validation.
- **i18n** (`i18n/`): i18n-js + expo-localization. Supports en, zh, zh-TW. LocaleContext in `context/`.
- **Types** (`types/`): ScheduleDraft (editable), Schedule (persisted), ParsedSchedulePayload (server response).

### Server (`server/`)

- **API Routes** (`server/app/api/`):
  - `devices/route.ts` — POST: register device & push token
  - `parse/route.ts` — POST: AI parse natural language → structured schedule
  - `schedules/route.ts` — GET (list by deviceId), POST (create)
  - `schedules/[id]/route.ts` — PUT (update), DELETE (delete)
  - `cron/send-reminders/route.ts` — POST: cron-triggered push notification sender
- **Libs** (`server/lib/`): `db.ts` (Vercel Postgres), `ai.ts` (AI SDK / OpenAI-compatible), `expo-push.ts` (Expo Push SDK)
- **Database**: Vercel Postgres (Neon), tables in `public` schema. Tables: `devices` (id, push_token, platform), `schedules` (id, device_id, title, start_at, end_at, reminder_minutes_before, recurrence, notes, original_message, reminder_sent_at).
- **Middleware** (`server/middleware.ts`): CORS handling for `/api/*` routes. Allows `localhost:4398` (dev) and `ALLOWED_ORIGIN` env var (production).
- **Migration**: `cd server && npm run migrate` (drizzle-kit migrate) or `npm run db:push` (direct schema push)
- **Scripts**: 独立脚本必须用 `.js` 编写，避免依赖 tsx 等 TypeScript 运行时。

### Device Identity

No user accounts. Each device generates a UUID on first launch, stored in AsyncStorage. Push token uploaded to `POST /api/devices` on startup.

### Reminder Flow

Server cron (`/api/cron/send-reminders`) runs every minute. Queries schedules where `start_at - reminder_minutes_before` is due. Handles single and recurring (DAILY/WEEKLY/MONTHLY) via `reminder_sent_at` tracking. Sends Expo Push notifications in batch.

### Patterns

- No global state library; page-level useState + business logic functions
- Result type (`client/src/lib/result.ts`) for error handling
- Enums use TypeScript `enum` in `client/src/constants/index.ts`（不单独文件），key 和 value 均为全大写形式（如 `enum ScheduleTab { TODAY = 'TODAY' }`）。所有新增枚举必须遵循此模式。
- 覆写 Tamagui 组件样式时，必须同时处理 4 种状态：default、hover（`hoverStyle`）、press（`pressStyle`）、disabled。避免某个状态下背景色与文字色冲突导致内容不可见。

## Tech Stack

**Client**: Expo 55, React Native 0.83, React 19, Tamagui 2.0-rc, Expo Router, i18n-js, TypeScript 5.9, Jest 29 + jest-expo + Testing Library, Babel with Tamagui plugin.

**Server**: Next.js 15, Vercel Postgres, ai SDK v6 + @ai-sdk/openai, Zod 4, expo-server-sdk, TypeScript 5.9, Vitest.

## Database Conventions

- **不使用外键约束**：表之间的关联通过应用层维护，schema 中不使用 `.references()`。
- **主键**：UUID 类型，`devices` 由客户端生成，`schedules` 使用 `defaultRandom()`。
- **索引**：为查询频繁的列手动添加索引（如 `device_id`、提醒查询组合索引）。
- **时间戳**：统一使用 `timestamp with time zone`，`created_at` 和 `updated_at` 默认 `now()`。
- **命名**：数据库列名 snake_case，Drizzle schema 字段 camelCase。
- **迁移**：使用 `npm run db:generate` 生成，`npm run migrate` 执行。每次 schema 变更后重新生成迁移文件。

## Testing

**Client**: Jest config at `client/jest.config.js`, setup at `client/jest.setup.ts` (mocks AsyncStorage, expo-notifications, tamagui.config). Tests colocated in `__tests__/` directories.

**Server**: Vitest. Route tests mock `@vercel/postgres`. Tests colocated next to route files.
