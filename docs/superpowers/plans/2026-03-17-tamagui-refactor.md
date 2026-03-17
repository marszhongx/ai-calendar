# Tamagui UI 重构实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将核心页面（主页、草稿编辑页）从 React Native StyleSheet 迁移到 Tamagui，实现视觉升级并支持亮色/深色主题。

**Architecture:** 安装 Tamagui 及其生态包，创建统一主题配置，在 root layout 中接入 TamaguiProvider。逐个重构组件，用 Tamagui 组件替换原生 RN 组件，删除 StyleSheet。

**Tech Stack:** Tamagui 2.x RC, @tamagui/config, @tamagui/toast, @tamagui/babel-plugin, Expo SDK 55, React Native 0.83

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| Create | `src/theme/tamagui.config.ts` | Tamagui 主题配置（tokens、themes） |
| Create | `src/theme/tamagui.d.ts` | Tamagui TypeScript 类型声明 |
| Modify | `babel.config.js` | 添加 @tamagui/babel-plugin |
| Modify | `app.json` | userInterfaceStyle → automatic |
| Modify | `app/_layout.tsx` | 接入 TamaguiProvider |
| Modify | `src/components/form-field.tsx` | 用 Tamagui 重写 |
| Modify | `src/components/message-input-form.tsx` | 用 Tamagui 重写 |
| Modify | `src/components/schedule-draft-form.tsx` | 用 Tamagui 重写 |
| Modify | `app/index.tsx` | 用 Tamagui 重写页面布局 |
| Modify | `app/draft.tsx` | 用 Tamagui 重写页面布局 + 修复 hook bug |
| Modify | `jest.setup.ts` | 添加 Tamagui mock |
| Modify | `jest.config.js` | transformIgnorePatterns 加入 tamagui |
| Modify | `app/__tests__/input-to-draft-flow.test.tsx` | 添加 TamaguiProvider 包裹 |

---

### Task 1: 安装 Tamagui 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Tamagui 核心依赖**

```bash
cd /Users/mars/Projects/ai-calendar && npx expo install tamagui @tamagui/config @tamagui/toast @tamagui/babel-plugin
```

注意：`tamagui` 已在 package.json 中（`^2.0.0-rc.26`），此命令会确保所有子包版本兼容。

- [ ] **Step 2: 验证安装成功**

```bash
cd /Users/mars/Projects/ai-calendar && cat package.json | grep -E "tamagui|@tamagui"
```

Expected: 应看到 `tamagui`、`@tamagui/config`、`@tamagui/toast`、`@tamagui/babel-plugin` 都在依赖中。

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add package.json package-lock.json 2>/dev/null; git add yarn.lock 2>/dev/null; git add bun.lockb 2>/dev/null
git commit -m "chore: 安装Tamagui及相关依赖"
```

---

### Task 2: 配置构建工具

**Files:**
- Modify: `babel.config.js`
- Modify: `app.json`

- [ ] **Step 1: 配置 babel.config.js 添加 Tamagui 插件**

将 `babel.config.js` 改为：

```javascript
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './src/theme/tamagui.config.ts',
        },
      ],
    ],
  };
};
```

- [ ] **Step 2: 修改 app.json 支持深色模式**

将 `app.json` 中 `"userInterfaceStyle": "light"` 改为 `"userInterfaceStyle": "automatic"`。

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add babel.config.js app.json
git commit -m "chore: 配置Tamagui babel插件和深色模式支持"
```

---

### Task 3: 创建 Tamagui 主题配置

**Files:**
- Create: `src/theme/tamagui.config.ts`
- Create: `src/theme/tamagui.d.ts`

- [ ] **Step 1: 创建 Tamagui 配置文件**

创建 `src/theme/tamagui.config.ts`：

```typescript
import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v3'

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      background: '#ffffff',
      color: '#1a1a1a',
      borderColor: '#e0e0e0',
      placeholderColor: '#999999',
      blue10: '#007AFF',
    },
    dark: {
      ...config.themes.dark,
      background: '#1a1a1a',
      color: '#f5f5f5',
      borderColor: '#333333',
      placeholderColor: '#666666',
      blue10: '#0A84FF',
    },
  },
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig
```

- [ ] **Step 2: 创建 TypeScript 声明文件**

创建 `src/theme/tamagui.d.ts`：

```typescript
import type { AppConfig } from './tamagui.config'

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd /Users/mars/Projects/ai-calendar && npx tsc --noEmit
```

Expected: 没有与 tamagui 配置相关的类型错误（可能有其他预存在的错误）。

- [ ] **Step 4: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add src/theme/
git commit -m "feat: 创建Tamagui主题配置（亮色/深色）"
```

---

### Task 4: 接入 TamaguiProvider

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: 修改 root layout 接入 TamaguiProvider**

将 `app/_layout.tsx` 改为：

```typescript
import { useColorScheme } from 'react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import { Stack } from 'expo-router'
import { LocaleProvider } from '../src/context/LocaleContext'
import config from '../src/theme/tamagui.config'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      <Theme name={colorScheme ?? 'light'}>
        <LocaleProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </LocaleProvider>
      </Theme>
    </TamaguiProvider>
  )
}
```

- [ ] **Step 2: 验证 app 能正常启动**

```bash
cd /Users/mars/Projects/ai-calendar && npx expo start --ios
```

Expected: app 正常启动，无报错。可以手动验证后 Ctrl+C 退出。

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add app/_layout.tsx
git commit -m "feat: 在root layout接入TamaguiProvider"
```

---

### Task 5: 配置测试环境支持 Tamagui

**Files:**
- Modify: `jest.setup.ts`
- Modify: `jest.config.js`
- Modify: `app/__tests__/input-to-draft-flow.test.tsx`

- [ ] **Step 1: 在 jest.setup.ts 添加 Tamagui mock**

在 `jest.setup.ts` 末尾追加：

```typescript
jest.mock('../src/theme/tamagui.config', () => {
  const { createTamagui } = require('tamagui');
  const { config } = require('@tamagui/config/v3');
  return { __esModule: true, default: createTamagui(config) };
});
```

- [ ] **Step 2: 在 jest.config.js 的 transformIgnorePatterns 中加入 tamagui**

将 `jest.config.js` 改为：

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnup: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|tamagui|@tamagui))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
};
```

- [ ] **Step 3: 在测试文件中添加 TamaguiProvider 包裹**

修改 `app/__tests__/input-to-draft-flow.test.tsx`，添加导入：

```typescript
import { TamaguiProvider } from 'tamagui'
import config from '../../src/theme/tamagui.config'
```

创建测试包裹器，替换所有 `<LocaleProvider>` 为：

```typescript
<TamaguiProvider config={config} defaultTheme="light">
  <LocaleProvider>
    {/* ... 原有内容 ... */}
  </LocaleProvider>
</TamaguiProvider>
```

每个 `render()` 调用都需要更新。共 8 处。

- [ ] **Step 4: 运行测试验证通过**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: 所有现有测试通过（此时组件尚未改动，只是添加了 Provider 包裹）。

- [ ] **Step 5: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add jest.setup.ts jest.config.js app/__tests__/input-to-draft-flow.test.tsx
git commit -m "test: 配置测试环境支持Tamagui"
```

---

### Task 6: 重构 FormField 组件

**Files:**
- Modify: `src/components/form-field.tsx`

- [ ] **Step 1: 用 Tamagui 重写 FormField**

将 `src/components/form-field.tsx` 改为：

```typescript
import type { ReactNode } from 'react'
import { Label, YStack } from 'tamagui'

type FormFieldProps = {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <YStack gap="$2">
      <Label fontSize="$4" fontWeight="bold">
        {label}
      </Label>
      {children}
    </YStack>
  )
}
```

注意：这是一个 API 破坏性变更（从 `{label, value, onChangeText}` 变为 `{label, children}`）。当前没有其他组件使用 FormField（ScheduleDraftForm 没有引入它），所以不会影响其他文件。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/mars/Projects/ai-calendar && npx tsc --noEmit
```

Expected: 无新增类型错误。

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add src/components/form-field.tsx
git commit -m "refactor: 用Tamagui重写FormField组件"
```

---

### Task 7: 重构 MessageInputForm 组件

**Files:**
- Modify: `src/components/message-input-form.tsx`

- [ ] **Step 1: 用 Tamagui 重写 MessageInputForm**

将 `src/components/message-input-form.tsx` 改为：

```typescript
import { useState } from 'react'
import { Button, SizableText, Spinner, TextArea, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

type MessageInputFormProps = {
  onSubmit(message: string): Promise<void>
  error?: string
}

export function MessageInputForm({ onSubmit, error }: MessageInputFormProps) {
  const { t } = useLocale()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)

    try {
      await onSubmit(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <YStack gap="$3" padding="$4">
      <SizableText size="$5" fontWeight="bold">
        {t('schedule.description')}
      </SizableText>
      <TextArea
        accessibilityLabel={t('schedule.description')}
        value={message}
        onChangeText={setMessage}
        size="$4"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$4"
        minHeight={120}
        placeholder={t('schedule.description')}
      />
      <Button
        size="$4"
        theme="active"
        onPress={handleSubmit}
        disabled={submitting}
        icon={submitting ? <Spinner size="small" /> : undefined}
      >
        {t('schedule.create')}
      </Button>
      {error ? (
        <SizableText color="$red10">
          {error}
        </SizableText>
      ) : null}
    </YStack>
  )
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: 与 MessageInputForm 相关的测试应通过。如果因为 Tamagui 组件渲染方式不同导致测试查询失败，需要在下一步修复。

- [ ] **Step 3: 修复失败的测试（如有）**

根据测试输出调整。常见问题：
- `getByText('Create Schedule')` 可能需要改为查找 Tamagui Button 的文本
- `getByLabelText('Description')` 需要确保 TextArea 的 `accessibilityLabel` 生效

- [ ] **Step 4: 确认所有测试通过**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add src/components/message-input-form.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "refactor: 用Tamagui重写MessageInputForm组件"
```

---

### Task 8: 重构 ScheduleDraftForm 组件

**Files:**
- Modify: `src/components/schedule-draft-form.tsx`

- [ ] **Step 1: 用 Tamagui 重写 ScheduleDraftForm**

将 `src/components/schedule-draft-form.tsx` 改为：

```typescript
import { Button, Input, Label, RadioGroup, SizableText, TextArea, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

import type { ScheduleDraft } from '../types'

type ScheduleDraftFormProps = {
  draft: ScheduleDraft
  errors: string[]
  onChange(draft: ScheduleDraft): void
  onSubmit(): void
}

const RECURRENCE_OPTIONS = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const

export function ScheduleDraftForm({ draft, errors, onChange, onSubmit }: ScheduleDraftFormProps) {
  const { t } = useLocale()

  const recurrenceLabels: Record<string, string> = {
    NONE: t('schedule.never'),
    DAILY: t('schedule.daily'),
    WEEKLY: t('schedule.weekly'),
    MONTHLY: t('schedule.monthly'),
  }

  return (
    <YStack gap="$3" padding="$4">
      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.eventName')}</Label>
        <Input
          accessibilityLabel={t('schedule.eventName')}
          value={draft.title}
          onChangeText={(title) => onChange({ ...draft, title })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.startTime')}</Label>
        <Input
          accessibilityLabel={t('schedule.startTime')}
          value={draft.startAt}
          onChangeText={(startAt) => onChange({ ...draft, startAt })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.remindMe')}</Label>
        <Input
          accessibilityLabel={t('schedule.remindMe')}
          value={String(draft.reminderMinutesBefore)}
          onChangeText={(value) =>
            onChange({
              ...draft,
              reminderMinutesBefore: Number.isNaN(Number(value)) ? 0 : Number(value),
            })
          }
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          keyboardType="numeric"
        />
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.repeat')}</Label>
        <RadioGroup
          value={draft.recurrence}
          onValueChange={(value) => onChange({ ...draft, recurrence: value as ScheduleDraft['recurrence'] })}
        >
          <XStack gap="$2" flexWrap="wrap">
            {RECURRENCE_OPTIONS.map((option) => (
              <RadioGroup.Item key={option} value={option} size="$3">
                <RadioGroup.Indicator />
                <SizableText size="$3" marginLeft="$2">
                  {recurrenceLabels[option]}
                </SizableText>
              </RadioGroup.Item>
            ))}
          </XStack>
        </RadioGroup>
      </YStack>

      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="bold">{t('schedule.description')}</Label>
        <TextArea
          accessibilityLabel={t('schedule.description')}
          value={draft.notes}
          onChangeText={(notes) => onChange({ ...draft, notes })}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          minHeight={80}
        />
      </YStack>

      <Button
        size="$4"
        theme="active"
        onPress={onSubmit}
      >
        {t('schedule.create')}
      </Button>

      {errors.map((error) => (
        <SizableText key={error} color="$red10">
          {error}
        </SizableText>
      ))}
    </YStack>
  )
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: 草稿相关测试通过。注意 RadioGroup 替换了原来的 Button 组来选择重复规则，测试中 `fireEvent.press(screen.getByText('Weekly'))` 可能需要调整为操作 RadioGroup.Item。

- [ ] **Step 3: 修复失败的测试（如有）**

根据测试输出调整查询方式。RadioGroup 的交互方式与 Button 不同，可能需要：
- 找到对应 RadioGroup.Item 并触发 press
- 或调整 RadioGroup.Item 使其保持可通过文本查找

- [ ] **Step 4: 确认所有测试通过**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add src/components/schedule-draft-form.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "refactor: 用Tamagui重写ScheduleDraftForm组件"
```

---

### Task 9: 重构主页布局（index.tsx）

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: 用 Tamagui 重写 index.tsx 页面布局**

将 `app/index.tsx` 改为：

```typescript
import { useState } from 'react'
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { MessageInputForm } from '../src/components/message-input-form'
import { normalizeDraft } from '../src/features/schedule/normalizer'
import { parseMessageWithAI } from '../src/features/schedule/parse-message'
import { ConfigManager } from '../src/config/ai-config'
import type { ScheduleDraft } from '../src/types'

type IndexScreenProps = {
  onSubmit?(message: string): Promise<ScheduleDraft>
}

function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'service_unavailable':
        return t('messages.serverError')
      case 'empty_response':
        return t('messages.dataLoadFailed')
      case 'invalid_format':
        return t('messages.validationError')
      default:
        return t('messages.error')
    }
  }

  return t('messages.error')
}

async function defaultSubmit(message: string) {
  const configManager = ConfigManager.getInstance()
  const aiConfig = configManager.getAIConfig()

  if (!aiConfig.apiKey) {
    throw new Error('AI API key is not configured')
  }

  const result = await parseMessageWithAI(message, aiConfig)

  if (!result.ok) {
    throw new Error(result.error)
  }

  return normalizeDraft(result.data)
}

export default function IndexScreen({ onSubmit = defaultSubmit }: IndexScreenProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState<ScheduleDraft | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(message: string) {
    setError('')

    try {
      const nextDraft = await onSubmit(message)
      setDraft(nextDraft)
    } catch (error) {
      setError(getErrorMessage(error, t))
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <MessageInputForm onSubmit={handleSubmit} error={error} />
        {draft ? (
          <YStack padding="$4" gap="$2">
            <SizableText color="$green10">{t('schedule.draftSaved')}</SizableText>
            <SizableText size="$5" fontWeight="bold">{draft.title}</SizableText>
          </YStack>
        ) : null}
      </YStack>
    </SafeAreaView>
  )
}
```

- [ ] **Step 2: 运行测试**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add app/index.tsx
git commit -m "refactor: 用Tamagui重写主页布局"
```

---

### Task 10: 重构草稿编辑页布局（draft.tsx）+ 修复 hook bug

**Files:**
- Modify: `app/draft.tsx`

- [ ] **Step 1: 用 Tamagui 重写 draft.tsx 并修复 hook bug**

将 `app/draft.tsx` 改为：

```typescript
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleDraftForm } from '../src/components/schedule-draft-form'
import { createScheduleRepository } from '../src/features/schedule/repository'
import { createReminderScheduler } from '../src/features/schedule/reminders'
import { validateDraft } from '../src/features/schedule/validation'
import type { Schedule, ScheduleDraft } from '../src/types'

const fallbackDraft: ScheduleDraft = {
  title: '待确认日程',
  startAt: '2026-03-17T15:00:00.000Z',
  timezone: 'Asia/Shanghai',
  reminderMinutesBefore: 30,
  recurrence: 'NONE',
  notes: '',
  confidence: 0.5,
  missingFields: [],
}

type DraftScreenProps = {
  initialDraft?: ScheduleDraft
  onCreate?(draft: ScheduleDraft): Promise<Schedule>
}

export default function DraftScreen({ initialDraft = fallbackDraft, onCreate }: DraftScreenProps) {
  const { t } = useLocale()
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<string[]>([])
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null)

  async function createSchedule(scheduleDraft: ScheduleDraft) {
    const repository = createScheduleRepository()
    const reminders = createReminderScheduler()
    const now = new Date().toISOString()
    const scheduleBase: Schedule = {
      id: `schedule-${Date.now()}`,
      title: scheduleDraft.title,
      startAt: scheduleDraft.startAt,
      endAt: scheduleDraft.endAt,
      timezone: scheduleDraft.timezone,
      reminderMinutesBefore: scheduleDraft.reminderMinutesBefore,
      recurrence: scheduleDraft.recurrence,
      notes: scheduleDraft.notes,
      createdAt: now,
      updatedAt: now,
    }
    const notificationId = await reminders.scheduleReminder(scheduleBase, t)
    const schedule = {
      ...scheduleBase,
      notificationId,
    }

    await repository.createSchedule(schedule)

    return schedule
  }

  async function handleSubmit() {
    const result = validateDraft(draft)
    setErrors(result.errors)

    if (!result.valid) {
      return
    }

    const handler = onCreate ?? createSchedule
    const schedule = await handler(draft)
    setCreatedSchedule(schedule)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <YStack flex={1} backgroundColor="$background" padding="$4" gap="$3">
          <SizableText size="$6" fontWeight="bold">
            {t('schedule.saveDraft')}
          </SizableText>
          <ScheduleDraftForm draft={draft} errors={errors} onChange={setDraft} onSubmit={handleSubmit} />
          {createdSchedule ? (
            <SizableText color="$green10">{t('schedule.published')}</SizableText>
          ) : null}
        </YStack>
      </ScrollView>
    </SafeAreaView>
  )
}
```

关键修复：`defaultCreate` 函数（非组件）中违规调用 `useLocale()` hook 的 bug。将其逻辑移入组件内部的 `createSchedule` 方法，从组件作用域访问 `t`。

- [ ] **Step 2: 运行测试**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
cd /Users/mars/Projects/ai-calendar
git add app/draft.tsx
git commit -m "refactor: 用Tamagui重写草稿编辑页并修复useLocale hook误用"
```

---

### Task 11: 最终验证

**Files:** 无新改动

- [ ] **Step 1: 运行全部测试**

```bash
cd /Users/mars/Projects/ai-calendar && npx jest --verbose
```

Expected: ALL PASS

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd /Users/mars/Projects/ai-calendar && npx tsc --noEmit
```

Expected: 无新增类型错误。

- [ ] **Step 3: 在模拟器中验证亮色模式**

```bash
cd /Users/mars/Projects/ai-calendar && npx expo start --ios
```

手动验证：
- 主页能正常显示，输入框、按钮样式正确
- 草稿编辑页表单字段完整，RadioGroup 可选择
- 深色/亮色切换跟随系统设置

- [ ] **Step 4: 验证深色模式**

在 iOS 模拟器中切换到深色模式（Settings > Developer > Dark Appearance），验证 UI 颜色正确切换。
