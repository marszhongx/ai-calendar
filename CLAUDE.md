# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on Web (React Native Web)
npm test               # Run all tests (Jest)
npm test -- --testPathPattern=<pattern>  # Run specific test file
npm run typecheck      # TypeScript type check
```

## Architecture

Cross-platform AI calendar app built with Expo 55 + React Native 0.83 + React 19. Users describe events in natural language, AI parses them into structured schedules, users confirm and save.

**Three-step flow**: Message input (`app/index.tsx`) → Draft confirmation (`app/draft.tsx`) → Schedule list (`app/schedules.tsx`). Plus AI config page (`app/config.tsx`).

### Key Layers

- **UI**: Tamagui 2.0-rc components and theming. Pages in `app/`, reusable components in `src/components/`.
- **Routing**: Expo Router (file-based routing in `app/`).
- **AI Service** (`src/services/index.ts`): Uses `ai` SDK with pluggable providers (Google, OpenAI, Anthropic). Zod schema validates structured output.
- **Schedule Feature** (`src/features/schedule/`): parse-message (AI call) → normalizer (structured output) → validation → repository (AsyncStorage) → reminders (Expo Notifications).
- **Config** (`src/config/ai-config.ts`): ConfigManager singleton reads from env vars, provides AI provider/model/apiKey/baseUrl.
- **i18n** (`src/i18n/`): i18n-js + expo-localization. Supports en, zh, zh-TW. LocaleContext in `src/context/`.
- **Storage abstraction** (`src/lib/storage.ts`): KeyValueStorage interface, AsyncStorage default, in-memory for tests.

### Patterns

- Repository pattern with dependency injection (storage, notification drivers are injectable)
- Result type (`src/lib/result.ts`) for error handling
- No global state library; page-level useState + business logic functions
- Types in `src/types/`: ScheduleDraft (editable), Schedule (persisted with id/timestamps/notificationId)
- Enums use TypeScript `enum` in `src/constants/index.ts`（不单独文件），key 和 value 均为全大写形式（如 `enum ScheduleTab { TODAY = 'TODAY' }`）。所有新增枚举必须遵循此模式。

## Tech Stack

Expo 55, React Native 0.83, React 19, Tamagui 2.0-rc, Expo Router, ai SDK v6 (Google/OpenAI/Anthropic), Zod 4, AsyncStorage, Expo Notifications, i18n-js, TypeScript 5.9, Jest 29 + jest-expo + Testing Library, Babel with Tamagui plugin.

## Testing

Jest config at `jest.config.js`, setup at `jest.setup.ts` (mocks AsyncStorage, expo-notifications, tamagui.config). Tests colocated in `__tests__/` directories.
