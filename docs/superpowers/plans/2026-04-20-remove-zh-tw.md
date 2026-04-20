# Remove zh-TW Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining `zh-TW` references so the repository clearly supports only `en` and `zh`.

**Architecture:** This is a narrow cleanup across one formatting helper, two ad-hoc i18n test scripts, and current documentation. The runtime locale model already only exposes `en | zh`, so the work is mainly aligning stray files and docs with that existing reality.

**Tech Stack:** TypeScript, Markdown, Node scripts, Expo i18n, Jest, Biome

---

## File Structure

- Modify: `src/lib/date-format.ts` — remove the stale `zh-TW` formatting branch from `toIntlLocale()`
- Modify: `test-i18n-functionality.js` — remove `zh-TW` import and Traditional Chinese assertions
- Modify: `test-i18n-functionality-updated.js` — remove `zh-TW` import and Traditional Chinese assertions
- Modify: `README.md` — change supported locales from `en、zh、zh-TW` to `en、zh`
- Modify: `CLAUDE.md` — change project guidance to state the app supports `en` and `zh` only
- Reference: `src/i18n/index.ts` — confirms runtime translations already load only `en` and `zh`
- Reference: `src/i18n/types.ts` — confirms `Locale` is already `en | zh`

### Task 1: Remove the stale zh-TW code branch

**Files:**
- Modify: `src/lib/date-format.ts`
- Reference: `src/i18n/types.ts:73-73`

- [ ] **Step 1: Update the helper logic to match the active locale model**

Replace `toIntlLocale()` with this exact implementation:

```ts
export function toIntlLocale(locale: string): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}
```

This removes the dead `zh-TW` branch and matches the existing `Locale` type.

- [ ] **Step 2: Run typecheck to verify the helper change is valid**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

### Task 2: Clean the standalone i18n test scripts

**Files:**
- Modify: `test-i18n-functionality.js`
- Modify: `test-i18n-functionality-updated.js`

- [ ] **Step 1: Rewrite `test-i18n-functionality.js` to only cover `en` and `zh`**

Replace the file with this content:

```js
// 测试国际化系统
const i18n = require('i18n-js')
const en = require('./src/i18n/locales/en.json')
const zh = require('./src/i18n/locales/zh.json')

// 配置国际化
const translations = { en, zh }
i18n.fallbacks = true
if (typeof i18n.store === 'function') {
  i18n.store(translations)
} else {
  i18n.translations = translations
}

console.log('Testing Internationalization System...\n')

// 测试英文
i18n.locale = 'en'
console.log('English:')
console.log('  Save:', i18n.t('common.save'))
console.log('  AI Settings:', i18n.t('aiConfig.title'))
console.log('  Schedule:', i18n.t('schedule.title'))
console.log('  Error:', i18n.t('messages.error'))

// 测试中文（简体）
i18n.locale = 'zh'
console.log('\nChinese (Simplified):')
console.log('  保存:', i18n.t('common.save'))
console.log('  AI配置:', i18n.t('aiConfig.title'))
console.log('  日程安排:', i18n.t('schedule.title'))
console.log('  操作失败:', i18n.t('messages.error'))

console.log('\n✅ Internationalization system working correctly!')
```

- [ ] **Step 2: Rewrite `test-i18n-functionality-updated.js` to only cover `en` and `zh`**

Replace the file with this content:

```js
// 测试国际化系统，包含新添加的 baseUrl 相关键
const { I18n } = require('i18n-js')
const en = require('./src/i18n/locales/en.json')
const zh = require('./src/i18n/locales/zh.json')

// 配置国际化
const i18n = new I18n({ en, zh })
i18n.enableFallback = true
i18n.defaultLocale = 'en'

console.log('Testing Internationalization System with new baseUrl keys...\n')

// 测试英文
i18n.locale = 'en'
console.log('English:')
console.log('  Save:', i18n.t('common.save'))
console.log('  AI Settings:', i18n.t('aiConfig.title'))
console.log('  Base URL:', i18n.t('aiConfig.baseUrl'))
console.log('  Base URL Placeholder:', i18n.t('aiConfig.baseUrlPlaceholder'))
console.log('  Schedule:', i18n.t('schedule.title'))

// 测试中文（简体）
i18n.locale = 'zh'
console.log('\nChinese (Simplified):')
console.log('  保存:', i18n.t('common.save'))
console.log('  AI配置:', i18n.t('aiConfig.title'))
console.log('  基础URL:', i18n.t('aiConfig.baseUrl'))
console.log('  基础URL占位符:', i18n.t('aiConfig.baseUrlPlaceholder'))
console.log('  日程安排:', i18n.t('schedule.title'))

console.log('\n✅ Internationalization system working correctly with new keys!')
```

- [ ] **Step 3: Run the two standalone scripts to verify they still execute cleanly**

Run:

```bash
node test-i18n-functionality.js && node test-i18n-functionality-updated.js
```

Expected: both scripts print English and Simplified Chinese output only, then exit successfully.

### Task 3: Align current documentation with supported locales

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md:45-45`

- [ ] **Step 1: Update the README locale claim**

Change this line in `README.md`:

```md
- 支持 en、zh、zh-TW
```

To:

```md
- 支持 en、zh
```

- [ ] **Step 2: Update the project guidance locale claim**

Change this line in `CLAUDE.md`:

```md
- **i18n** (`i18n/`): i18n-js + expo-localization. Supports en, zh, zh-TW. LocaleContext in `context/`.
```

To:

```md
- **i18n** (`i18n/`): i18n-js + expo-localization. Supports en, zh. LocaleContext in `context/`.
```

- [ ] **Step 3: Search for remaining zh-TW references and remove any current-scope leftovers**

Run:

```bash
rg "zh-TW" README.md CLAUDE.md src test-i18n-functionality.js test-i18n-functionality-updated.js
```

Expected: no matches in those current implementation and current documentation files.

### Task 4: Run repository verification and review scope

**Files:**
- Modify: `src/lib/date-format.ts`
- Modify: `test-i18n-functionality.js`
- Modify: `test-i18n-functionality-updated.js`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Run the required repository checks**

Run:

```bash
npm run typecheck && npm run lint
```

Expected: PASS for both commands.

- [ ] **Step 2: Run the active test suite**

Run:

```bash
npm test -- --runInBand
```

Expected: PASS for the existing Jest suite.

- [ ] **Step 3: Review the diff for scope control**

Run:

```bash
git diff -- src/lib/date-format.ts test-i18n-functionality.js test-i18n-functionality-updated.js README.md CLAUDE.md docs/superpowers/specs/2026-04-20-remove-zh-tw-design.md docs/superpowers/plans/2026-04-20-remove-zh-tw.md
```

Expected: only zh-TW cleanup changes plus the approved spec/plan documents are present.

## Self-Review

- Spec coverage: the plan removes the zh-TW code branch, updates residual scripts, corrects current docs, and verifies the repository state.
- Placeholder scan: every change step includes exact replacement content or exact commands.
- Type consistency: the plan keeps locale behavior aligned with the already-existing `Locale = 'en' | 'zh'` model.
