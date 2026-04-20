# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server (port 4398)
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on Web (React Native Web)
npm test               # Run tests (Jest)
npm run typecheck      # TypeScript type check
npm run lint           # Biome lint + format check
```

完成代码修改后，必须同时通过 typecheck 和 lint 两项检查：

```bash
npm run typecheck && npm run lint
```

## Architecture

Local-only Expo app. Users describe events in natural language, the app calls an OpenAI-compatible LLM to parse them into structured schedules, stores everything locally in AsyncStorage, and uses local notifications for reminders.

### Pages (`app/`)

- `index.tsx` — Schedule list (tab filter: today/tomorrow/all)
- `new.tsx` — Natural language input
- `draft.tsx` — Draft confirmation & editing
- `schedule/[id].tsx` — Schedule detail & edit
- `config.tsx` — AI API configuration (base URL, API key, model name)
- `_layout.tsx` — Root layout

### Layers (`src/`)

- **Services** (`services/index.ts`): Local CRUD operations using AsyncStorage for schedules.
- **AI Service** (`services/ai.ts`): Calls OpenAI-compatible LLM via `ai` SDK + `@ai-sdk/openai` to parse natural language into structured schedules.
- **AI Config** (`config/ai-config.ts`): Manages AI API configuration (base URL, API key, model) via AsyncStorage with env var defaults.
- **UI**: Tamagui 2.0-rc components and theming. Pages in `app/`, reusable components in `src/components/`.
- **Routing**: Expo Router (file-based routing in `app/`).
- **Normalizer** (`utils/schedule-normalizer.ts`): Transforms AI `ParsedSchedulePayload` (snake_case) into client `ScheduleDraft` (camelCase).
- **Validation** (`utils/schedule-validation.ts`): Pre-submission client-side validation.
- **i18n** (`i18n/`): i18n-js + expo-localization. Supports en, zh. LocaleContext in `context/`.
- **Types** (`types/`): ScheduleDraft (editable), Schedule (persisted), ParsedSchedulePayload (AI response).

### Storage

All data stored in AsyncStorage:
- `schedules` — JSON array of Schedule objects
- `ai-config` — AI API configuration (base URL, API key, model name)

### Patterns

- No global state library; page-level useState + business logic functions
- Result type (`src/lib/result.ts`) for error handling
- Enums use TypeScript `enum` in `src/constants/index.ts`（不单独文件），key 和 value 均为全大写形式（如 `enum ScheduleTab { TODAY = 'TODAY' }`）。所有新增枚举必须遵循此模式。
- 覆写 Tamagui 组件样式时，必须同时处理 4 种状态：default、hover（`hoverStyle`）、press（`pressStyle`）、disabled。避免某个状态下背景色与文字色冲突导致内容不可见。
- 禁止重导出（无论是 `export { x } from './y'` 还是先 import 再 export）。每个模块只导出自己定义的内容，消费方直接从源模块导入。

## Tech Stack

Expo 55, React Native 0.83, React 19, Tamagui 2.0-rc, Expo Router, i18n-js, ai SDK v6 + @ai-sdk/openai, Zod 4, TypeScript 5.9, Jest 29 + jest-expo + Testing Library, Babel with Tamagui plugin.

## Testing

Jest config at `jest.config.js`, setup at `jest.setup.ts` (mocks AsyncStorage, expo-notifications, tamagui.config). Tests colocated in `__tests__/` directories.
