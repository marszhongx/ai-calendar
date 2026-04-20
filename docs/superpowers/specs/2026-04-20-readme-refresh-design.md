# README Refresh Design

## Problem

The current `README.md` still describes the project as a client/server workspace with a Next.js backend, API routes, database persistence, and server-side cron push reminders. That no longer matches the repository. The app is now a local-only Expo application that stores data in AsyncStorage, calls an OpenAI-compatible model directly from the client flow, and uses local notifications for reminders.

## Goal

Update `README.md` so that it accurately reflects the current implementation while staying lightweight. The README should primarily help readers quickly understand what the app does, how it works at a high level, how to run it, and what its current boundaries are.

It should avoid deep implementation detail unless that detail is necessary to explain the current product behavior.

## Requirements

1. Remove outdated backend-oriented content:
   - workspace layout (`client/`, `server/`)
   - Next.js server references
   - API endpoint documentation
   - Vercel Postgres / server persistence
   - server cron / Expo push delivery flow
   - root `.env` examples that only apply to a removed backend

2. Rewrite the project description to match the current repo:
   - single Expo app
   - local-first storage with AsyncStorage
   - AI parsing through an OpenAI-compatible API
   - local notifications for reminders

3. Keep the README useful for first-time readers:
   - concise value proposition
   - current feature list
   - startup commands that actually work now
   - current testing / verification commands

4. Keep implementation explanation high-level:
   - enough to explain the main app flow
   - enough to explain local storage and AI configuration behavior
   - avoid exhaustive page-by-page or layer-by-layer documentation

5. Reflect current product boundaries:
   - local-only app
   - no account system
   - no cloud sync
   - no external calendar sync
   - no multi-event splitting

6. Mention recent behavior that materially affects current UX:
   - expired schedules are filtered from today/tomorrow
   - expired schedules remain visible in all schedules with expired styling

## Recommended Approach

### Option 1 — User-first README with light implementation notes (recommended)

Structure the README as a GitHub-friendly landing page: introduction, features, quick start, AI configuration, then a short explanation of the app flow and current limitations.

**Why this is recommended:**
- Works best as the repo homepage
- Gives new readers fast orientation
- Keeps the document focused and easy to scan
- Matches the updated preference for less technical detail

### Option 2 — Balanced README with moderate architecture detail

Lead with user-facing content, then add concise sections for structure, storage, and flow.

**Trade-off:** still readable, but may include more internal detail than necessary.

### Option 3 — Minimal command-only refresh

Only replace outdated commands/config and remove backend claims.

**Trade-off:** fast, but too shallow to explain how the current app actually works.

## Design

### README section order

1. `# ai-calendar`
2. Short product summary
3. Core features
4. Tech stack
5. Quick start
6. AI configuration
7. How it works
8. Local storage
9. Testing and verification
10. Current limitations

### Section details

#### 1. Summary

Describe the app as a **local-only Expo AI calendar assistant**. The description should emphasize:
- natural-language input
- AI-generated structured schedule drafts
- confirmation/editing before save
- local reminders
- multilingual support

#### 2. Core features

List only capabilities visible in the current implementation:
- natural-language schedule parsing
- draft confirmation and editing
- create / view / edit / delete schedules
- recurrence support (single, daily, weekly, monthly)
- today / tomorrow / all tabs
- expired schedule filtering and expired styling
- multilingual UI (`en`, `zh`, `zh-TW`)
- configurable OpenAI-compatible provider

#### 3. Tech stack

Summarize the active stack from `package.json` and project guidance:
- Expo 55
- React Native 0.83 + React 19
- Expo Router
- Tamagui 2.0 RC
- AsyncStorage
- `ai` SDK + `@ai-sdk/openai`
- Zod
- Jest + Testing Library
- TypeScript + Biome

#### 4. Quick start

Use the actual root commands that exist now:

```bash
npm install
npm start
npm run ios
npm run android
npm run web
```

Also note that the Expo dev server uses port `4398`.

#### 5. AI configuration

Explain the current configuration model:
- configure base URL, API key, and model inside the app’s config page
- AsyncStorage persists those values locally
- env defaults may exist, but the app is configured as a local client app rather than a backend service

This section should avoid inventing or over-specifying env variable names unless they are verified in code during implementation.

#### 6. How it works

Describe the current app logic at a high level:
1. user enters natural language
2. app calls the configured OpenAI-compatible model
3. the response becomes an editable draft
4. user confirms or adjusts the draft
5. the schedule is saved locally
6. the app shows schedules in today / tomorrow / all views
7. reminders are handled locally on device

This section should stay concise and avoid deep file-structure documentation.

#### 7. Local storage

Document the current storage keys already described by the project guidance:
- `schedules`
- `ai-config`

Clarify that both are stored in AsyncStorage on device.

#### 8. Testing and verification

Include:

```bash
npm test
npm run typecheck
npm run lint
```

And explicitly note the repository rule that code changes should pass:

```bash
npm run typecheck && npm run lint
```

#### 9. Current limitations

State the intentionally unsupported areas:
- no account system
- no cloud sync
- no external calendar sync
- no multi-event splitting
- local-device storage only

## Scope Boundaries

This README refresh is documentation-only. It should not change code, app behavior, or project structure. It should only update the repository’s top-level description so it matches the current implementation.

## Self-Review

- No placeholders remain.
- The design is focused on a single documentation update.
- All proposed README sections map to current repository behavior already observed.
- The design explicitly avoids unverified backend/environment claims.
