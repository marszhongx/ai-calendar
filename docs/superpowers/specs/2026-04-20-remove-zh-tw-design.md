# Remove zh-TW Support Design

## Problem

The repository no longer implements `zh-TW` as a real locale in the active i18n runtime, but several files still mention or branch on `zh-TW`. That leaves stale documentation, outdated test scripts, and an unnecessary locale formatting branch that suggests Traditional Chinese is still supported.

## Goal

Remove `zh-TW` support completely so the project clearly supports only `en` and `zh`.

This change should be a cleanup-only update:
- no compatibility layer
- no migration for previously stored values
- no expansion of the i18n system

## Requirements

1. Active locale support must be documented and implemented as `en` and `zh` only.
2. Any remaining `zh-TW`-specific logic must be removed.
3. Residual test scripts that still import or assert `zh-TW` must be updated or removed.
4. Documentation that claims `zh-TW` support must be corrected.
5. No backward-compatibility behavior should be introduced for historical `zh-TW` values.

## Recommended Approach

### Option 1 — Full removal with no compatibility (recommended)

Delete every remaining `zh-TW` reference in active code, cleanup scripts, and user-facing documentation.

**Why this is recommended:**
- Matches the user’s explicit preference
- Removes stale branches and misleading claims
- Keeps the language model simple: supported locales are exactly `en` and `zh`

### Option 2 — Keep input mapping but hide support

Accept `zh-TW` internally and map it to `zh`, while removing it from docs and UI.

**Trade-off:** adds compatibility behavior the user explicitly does not want.

### Option 3 — Documentation-only cleanup

Update docs but leave test scripts and code branches untouched.

**Trade-off:** misleading leftovers remain in code, so support status stays ambiguous.

## Design

### Scope

This work should only remove stale `zh-TW` support references. It should not redesign locale selection, translation loading, or locale persistence.

### Files to update

#### 1. `src/lib/date-format.ts`

Remove the `zh-TW` conditional branch from `toIntlLocale()`.

Target behavior:
- `zh` → `zh-CN`
- all other values → `en-US`

This keeps the formatter aligned with the actual `Locale` type, which already only allows `en | zh`.

#### 2. `README.md`

Update language support claims from `en、zh、zh-TW` to `en、zh`.

#### 3. `CLAUDE.md`

Update the project architecture note so it no longer claims `zh-TW` support.

#### 4. `test-i18n-functionality.js`
#### 5. `test-i18n-functionality-updated.js`

These scripts still import `zh-TW` locale data and explicitly test `zh-TW` behavior. Since the project should no longer support `zh-TW`, these scripts should be cleaned up so they only cover `en` and `zh`, or be removed entirely if they are obsolete helper scripts rather than part of the real test suite.

Preferred direction: keep them only if they still provide value, but remove all `zh-TW` usage.

### Testing

Validation should cover:
1. repository search no longer finds `zh-TW` in active implementation or current user-facing docs for supported locales
2. `npm run typecheck && npm run lint` passes
3. run `npm test` if the touched files affect active test coverage

### Boundaries

Do not:
- add locale migration logic
- add fallback aliases for `zh-TW`
- expand translation files
- refactor unrelated i18n code

## Self-Review

- No placeholders remain.
- The scope is narrow and focused on cleanup.
- The design matches the explicit requirement to avoid compatibility behavior.
- Code, scripts, and docs are all covered so the support change is unambiguous.
