# Tamagui UI 重构设计文档

## 概述

将剩余 4 个文件从 React Native 原生组件迁移到 Tamagui，同时改进 UI 设计。采用逐文件迁移策略，按依赖顺序进行。

## 重构范围

| 文件 | 当前状态 | 目标 |
|------|---------|------|
| `src/components/schedule-list.tsx` | View/Text | Tamagui 卡片式列表 |
| `app/schedules.tsx` | View/Text | Tamagui 页面布局 |
| `src/components/ai-config-form.tsx` | View/TextInput/TouchableOpacity + StyleSheet | Tamagui 表单 + 分段控件 |
| `app/config.tsx` | View/Text + 内联样式 | Tamagui 页面布局 |

## 执行顺序

1. `schedule-list.tsx` → 2. `schedules.tsx` → 3. `ai-config-form.tsx` → 4. `config.tsx`

## 设计详情

### 1. schedule-list.tsx — 日程卡片列表

- `View/Text` → `YStack/XStack/SizableText/Card`
- 每条日程渲染为 Tamagui `Card`，包含：
  - 标题：`SizableText` 加粗，较大字号
  - 时间：`SizableText` 较小字号，使用 `$placeholderColor` 主题色
  - 如果 `endAt` 存在，显示时间范围（`startAt - endAt`）
  - 备注：`SizableText`，条件渲染（`schedule.notes ? <SizableText>...</SizableText> : null`）
- 卡片间距通过 `YStack gap="$3"` 控制
- 使用 `ScrollView` 包裹列表，支持内容溢出滚动
- 空列表状态显示居中提示文字
- 使用主题 token，自动支持深色模式

### 2. schedules.tsx — 日程列表页面

- `View/Text` → `YStack/SizableText`
- 使用 `SafeAreaView`（从 `react-native-safe-area-context` 导入）包裹，与 `index.tsx` 一致
- 页面标题：`SizableText size="$8" fontWeight="bold"`
- 布局：`YStack flex={1} backgroundColor="$background" padding="$4"`

### 3. ai-config-form.tsx — AI 配置表单

- 移除整个 `StyleSheet`，使用 Tamagui 主题 token
- 布局：`YStack gap="$4" padding="$4"` + `backgroundColor="$background"` + `borderRadius="$4"`
- 4 个字段的组件映射：
  - Provider：`FormField` + `XStack` 包裹三个 `Button`，选中项 `theme="active"`，未选中默认主题
  - Model Name：`FormField` + `Input`
  - API Key：`FormField` + `Input` + `secureTextEntry`
  - Base URL：`FormField` + `Input` + `keyboardType="url"`
- 保存按钮：`Button size="$4" theme="active"`
- `Alert.alert` 保持不变（RN 原生弹窗）
- 自动支持深色模式

### 4. config.tsx — AI 配置页面

- `View/Text` → `YStack/SizableText`
- 使用 `SafeAreaView`（从 `react-native-safe-area-context` 导入）包裹
- 新增 `useLocale` 导入，页面标题使用 `t('ai_config.title')` 国际化（需确认 i18n 翻译文件中已有对应 key，如无则新增）
- 页面标题：`SizableText size="$8" fontWeight="bold"`
- 布局：`YStack flex={1} backgroundColor="$background" padding="$4"`
- 移除内联 style 对象

## 设计原则

- 遵循已重构文件的模式（`message-input-form.tsx`、`index.tsx` 等）
- 全部使用 Tamagui 主题 token，不硬编码颜色
- 自动支持亮色/深色模式
- 每步完成后跑测试验证
