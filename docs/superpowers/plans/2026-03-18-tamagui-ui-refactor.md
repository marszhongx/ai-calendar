# Tamagui UI 重构实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将剩余 4 个文件从 React Native 原生组件迁移到 Tamagui，采用卡片式日程列表和分段控件式 Provider 选择器。

**Architecture:** 逐文件迁移，按依赖顺序（先组件后页面）。每个文件替换 RN 原生组件为 Tamagui 等价组件，使用主题 token 实现深色模式支持。

**Tech Stack:** Tamagui 2.0 RC26, Expo Router, React Native, @testing-library/react-native

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/components/schedule-list.tsx` | 修改 | 日程卡片列表组件 |
| `app/schedules.tsx` | 修改 | 日程列表页面 |
| `src/components/ai-config-form.tsx` | 修改 | AI 配置表单组件 |
| `app/config.tsx` | 修改 | AI 配置页面 |
| `app/__tests__/input-to-draft-flow.test.tsx` | 修改 | 添加新的测试用例 |

---

### Task 1: 重构 schedule-list.tsx

**Files:**
- Modify: `src/components/schedule-list.tsx`
- Test: `app/__tests__/input-to-draft-flow.test.tsx`

**Spec:** @docs/superpowers/specs/2026-03-18-tamagui-ui-refactor-design.md §1

- [ ] **Step 1: 写失败测试 — 日程卡片渲染 endAt**

在 `app/__tests__/input-to-draft-flow.test.tsx` 中添加测试，验证当 `endAt` 存在时显示时间范围：

```tsx
it('renders schedule card with time range when endAt exists', () => {
  renderWithProviders(
    <SchedulesScreen
      schedules={[
        {
          id: 'schedule-range',
          title: '团队会议',
          startAt: '2026-03-18T09:00:00.000Z',
          endAt: '2026-03-18T10:00:00.000Z',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 10,
          recurrence: 'NONE',
          notes: '',
          notificationId: 'n-1',
          createdAt: '2026-03-17T09:00:00.000Z',
          updatedAt: '2026-03-17T09:00:00.000Z',
        },
      ]}
    />
  );

  expect(screen.getByText('团队会议')).toBeOnTheScreen();
  expect(screen.getByText('2026-03-18T09:00:00.000Z - 2026-03-18T10:00:00.000Z')).toBeOnTheScreen();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --testNamePattern="renders schedule card with time range" --no-coverage`
Expected: FAIL — 当前 schedule-list 不显示时间范围

- [ ] **Step 3: 写失败测试 — 备注为空时不渲染**

```tsx
it('hides notes when schedule notes is empty', () => {
  renderWithProviders(
    <SchedulesScreen
      schedules={[
        {
          id: 'schedule-no-notes',
          title: '空备注日程',
          startAt: '2026-03-18T09:00:00.000Z',
          timezone: 'Asia/Shanghai',
          reminderMinutesBefore: 0,
          recurrence: 'NONE',
          notes: '',
          notificationId: 'n-2',
          createdAt: '2026-03-17T09:00:00.000Z',
          updatedAt: '2026-03-17T09:00:00.000Z',
        },
      ]}
    />
  );

  expect(screen.getByText('空备注日程')).toBeOnTheScreen();
  expect(screen.queryByTestId('schedule-notes-schedule-no-notes')).not.toBeOnTheScreen();
});
```

- [ ] **Step 4: 实现 schedule-list.tsx Tamagui 重构**

```tsx
import { ScrollView } from 'react-native'
import { Card, SizableText, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'

import type { Schedule } from '../types'

type ScheduleListProps = {
  schedules: Schedule[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  const { t } = useLocale()

  if (schedules.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <SizableText color="$placeholderColor">{t('schedule.emptyList')}</SizableText>
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} bordered padding="$4" borderRadius="$4">
            <YStack gap="$2">
              <SizableText size="$5" fontWeight="bold">
                {schedule.title}
              </SizableText>
              <SizableText size="$3" color="$placeholderColor">
                {schedule.endAt
                  ? `${schedule.startAt} - ${schedule.endAt}`
                  : schedule.startAt}
              </SizableText>
              {schedule.notes ? (
                <SizableText testID={`schedule-notes-${schedule.id}`} size="$3">
                  {schedule.notes}
                </SizableText>
              ) : null}
            </YStack>
          </Card>
        ))}
      </YStack>
    </ScrollView>
  )
}
```

- [ ] **Step 5: 运行全部测试确认通过**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --no-coverage`
Expected: ALL PASS

- [ ] **Step 6: 提交**

```bash
git add src/components/schedule-list.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat: refactor schedule-list to Tamagui card layout"
```

---

### Task 2: 重构 schedules.tsx

**Files:**
- Modify: `app/schedules.tsx`
- Test: `app/__tests__/input-to-draft-flow.test.tsx`

**Spec:** @docs/superpowers/specs/2026-03-18-tamagui-ui-refactor-design.md §2

- [ ] **Step 1: 实现 schedules.tsx Tamagui 重构**

```tsx
import { useEffect, useState } from 'react'
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'

import { ScheduleList } from '../src/components/schedule-list'
import { createScheduleRepository } from '../src/features/schedule/repository'
import type { Schedule } from '../src/types'

type SchedulesScreenProps = {
  schedules?: Schedule[]
}

export default function SchedulesScreen({ schedules }: SchedulesScreenProps) {
  const { t } = useLocale()
  const [items, setItems] = useState<Schedule[]>(schedules ?? [])

  useEffect(() => {
    if (schedules) {
      setItems(schedules)
      return
    }

    createScheduleRepository()
      .listSchedules()
      .then(setItems)
  }, [schedules])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <SizableText size="$8" fontWeight="bold" marginBottom="$4">
          {t('schedule.scheduleList')}
        </SizableText>
        <ScheduleList schedules={items} />
      </YStack>
    </SafeAreaView>
  )
}
```

- [ ] **Step 2: 运行测试确认通过**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --no-coverage`
Expected: ALL PASS — 现有测试 "renders the schedules screen placeholder" 和 "creates a schedule and renders it in the list screen" 应继续通过

- [ ] **Step 3: 提交**

```bash
git add app/schedules.tsx
git commit -m "feat: refactor schedules page to Tamagui layout"
```

---

### Task 3: 重构 ai-config-form.tsx

**Files:**
- Modify: `src/components/ai-config-form.tsx`
- Test: `app/__tests__/input-to-draft-flow.test.tsx`

**Spec:** @docs/superpowers/specs/2026-03-18-tamagui-ui-refactor-design.md §3

- [ ] **Step 1: 写失败测试 — AI 配置表单渲染**

在 `app/__tests__/input-to-draft-flow.test.tsx` 顶部添加 `ConfigScreen` 导入，并添加测试：

```tsx
import ConfigScreen from '../config';
```

```tsx
it('renders the config screen with provider buttons and form fields', () => {
  renderWithProviders(<ConfigScreen />);

  expect(screen.getByText('Google')).toBeOnTheScreen();
  expect(screen.getByText('OpenAI')).toBeOnTheScreen();
  expect(screen.getByText('Anthropic')).toBeOnTheScreen();
  expect(screen.getByText('Save Settings')).toBeOnTheScreen();
});
```

- [ ] **Step 2: 运行测试确认当前也通过（基线）**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --testNamePattern="renders the config screen" --no-coverage`
Expected: PASS — 当前实现已有这些文本，这是一个基线测试确保重构不破坏

- [ ] **Step 3: 实现 ai-config-form.tsx Tamagui 重构**

```tsx
import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { Button, Input, XStack, YStack } from 'tamagui'
import { useLocale } from '../context/LocaleContext'
import { ConfigManager } from '../config/ai-config'
import { FormField } from './form-field'

type AIConfigFormProps = {
  onConfigChange?: () => void
}

export function AIConfigForm({ onConfigChange }: AIConfigFormProps) {
  const { t } = useLocale()
  const configManager = ConfigManager.getInstance()
  const currentConfig = configManager.getConfig()

  const [provider, setProvider] = useState(currentConfig.aiProvider)
  const [model, setModel] = useState(currentConfig.aiModel)
  const [apiKey, setApiKey] = useState(currentConfig.aiApiKey)
  const [baseUrl, setBaseUrl] = useState(currentConfig.aiBaseUrl || '')

  useEffect(() => {
    setProvider(currentConfig.aiProvider)
    setModel(currentConfig.aiModel)
    setApiKey(currentConfig.aiApiKey)
    setBaseUrl(currentConfig.aiBaseUrl || '')
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert(t('messages.error'), t('messages.invalidInput'))
      return
    }

    configManager.updateConfig({
      aiProvider: provider as 'google' | 'openai' | 'anthropic',
      aiModel: model,
      aiApiKey: apiKey,
      aiBaseUrl: baseUrl || undefined
    })

    Alert.alert(t('messages.success'), t('ai_config.saveSuccess'))

    if (onConfigChange) {
      onConfigChange()
    }
  }

  return (
    <YStack gap="$4" padding="$4" backgroundColor="$background" borderRadius="$4">
      <FormField label={t('ai_config.provider')}>
        <XStack gap="$2">
          {(['google', 'openai', 'anthropic'] as const).map((p) => (
            <Button
              key={p}
              flex={1}
              size="$3"
              theme={provider === p ? 'active' : undefined}
              onPress={() => setProvider(p)}
            >
              {p === 'google' ? 'Google' : p === 'openai' ? 'OpenAI' : 'Anthropic'}
            </Button>
          ))}
        </XStack>
      </FormField>

      <FormField label={t('ai_config.modelName')}>
        <Input
          value={model}
          onChangeText={setModel}
          placeholder={t('ai_config.defaultModel')}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <FormField label={t('ai_config.apiKey')}>
        <Input
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={t('ai_config.apiKey')}
          secureTextEntry
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <FormField label={t('ai_config.baseUrl')}>
        <Input
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder={t('ai_config.baseUrlPlaceholder')}
          keyboardType="url"
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
        />
      </FormField>

      <Button size="$4" theme="active" onPress={handleSave}>
        {t('ai_config.saveSettings')}
      </Button>
    </YStack>
  )
}
```

- [ ] **Step 4: 运行全部测试确认通过**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --no-coverage`
Expected: ALL PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/ai-config-form.tsx app/__tests__/input-to-draft-flow.test.tsx
git commit -m "feat: refactor ai-config-form to Tamagui with segmented control"
```

---

### Task 4: 重构 config.tsx

**Files:**
- Modify: `app/config.tsx`

**Spec:** @docs/superpowers/specs/2026-03-18-tamagui-ui-refactor-design.md §4

- [ ] **Step 1: 实现 config.tsx Tamagui 重构**

```tsx
import { SizableText, YStack } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocale } from '../src/context/LocaleContext'
import { AIConfigForm } from '../src/components/ai-config-form'

export default function ConfigScreen() {
  const { t } = useLocale()

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <SizableText size="$8" fontWeight="bold" marginBottom="$4">
          {t('ai_config.title')}
        </SizableText>
        <AIConfigForm />
      </YStack>
    </SafeAreaView>
  )
}
```

- [ ] **Step 2: 运行全部测试确认通过**

Run: `npx jest app/__tests__/input-to-draft-flow.test.tsx --no-coverage`
Expected: ALL PASS

- [ ] **Step 3: 运行完整测试套件最终验证**

Run: `npx jest --no-coverage`
Expected: ALL 37+ tests PASS

- [ ] **Step 4: 提交**

```bash
git add app/config.tsx
git commit -m "feat: refactor config page to Tamagui layout with i18n title"
```
