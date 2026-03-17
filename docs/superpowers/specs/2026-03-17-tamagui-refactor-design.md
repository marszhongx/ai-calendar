# Tamagui UI 重构设计

## 概述

将 AI Calendar 的核心页面（主页、草稿编辑页）从 React Native 原生 StyleSheet 迁移到 Tamagui UI 框架，实现视觉升级并建立统一的主题系统（亮色 + 深色模式）。

## 范围

- 本次重构：主页（index.tsx + MessageInputForm）、草稿编辑页（draft.tsx + ScheduleDraftForm）、通用组件 FormField
- 不在范围内：日程列表页（schedules.tsx）、AI 配置页（config.tsx），留待后续迭代
- 主题切换仅跟随系统设置，手动切换留后续迭代

## 方案选择

采用 **Tamagui 全套集成**：一次性建立主题系统和深色模式，为后续页面迁移铺路。排除渐进式迁移（两套样式系统维护成本高）和过度封装方案（YAGNI）。

## 第1部分：Tamagui 配置与主题系统

### 依赖

- `tamagui`、`@tamagui/config`
- `@tamagui/toast`（Toast 通知）
- `@tamagui/babel-plugin`（编译优化）

### 构建配置

- `babel.config.js`：添加 `@tamagui/babel-plugin`，配置 `components` 和 `config` 路径
- `metro.config.js`：如需额外配置，按 Tamagui + Expo 官方文档调整
- `app.json`：`userInterfaceStyle` 从 `"light"` 改为 `"automatic"` 以支持深色模式

### 主题配置 `src/theme/tamagui.config.ts`

- 基于 `@tamagui/config` 默认 config 扩展
- 自定义 tokens：主色 `#007AFF`（iOS 蓝）、背景色、文字色、间距、圆角等
- 定义 `light` 和 `dark` 两套主题，颜色映射语义化（`background`、`color`、`borderColor`、`placeholderColor` 等）

### Provider 集成 `app/_layout.tsx`

- `TamaguiProvider` 包裹整个 app
- `useColorScheme()` 检测系统设置，传入 `defaultTheme`
- 保持现有 `LocaleProvider` 嵌套

## 第2部分：主页重构（index.tsx + MessageInputForm）

- 页面容器：`YStack` 替代 `View`，利用主题 `background` token
- 顶部标题：`SizableText` 显示 app 标题
- 文本输入：Tamagui `TextArea` 替代 `TextInput`
- 提交按钮：Tamagui `Button`，支持 `icon` 属性展示加载 `Spinner`
- 加载状态：Tamagui `Spinner` 替代 `ActivityIndicator`
- 错误信息：`SizableText` + `color="$red10"` 内联展示（保持现有交互方式）
- 间距：`YStack` 的 `gap` 和 `padding` token，删除 `StyleSheet.create()`

## 第3部分：草稿编辑页重构（draft.tsx + ScheduleDraftForm）

- 容器：`ScrollView` + `YStack`，支持长表单滚动
- 表单字段：Tamagui `Label` + `Input` / `TextArea`
- 时间字段：Tamagui `Input` 替代原生 `TextInput`（当前为文本输入，保持不变）
- 重复规则：Tamagui `RadioGroup`（NONE / DAILY / WEEKLY / MONTHLY）
- 提醒时间：Tamagui `Input`（保持当前的分钟数自由输入方式）
- 备注：Tamagui `TextArea`
- 保存按钮：Tamagui `Button` + `theme="active"`
- 置信度：`SizableText` + 颜色 token
- `FormField` 通用组件用 Tamagui 重写：`YStack` + `Label` + children，新 props 为 `{ label: string; children: ReactNode }`
- 删除所有 `StyleSheet.create()`

### 已知 Bug 修复

- `draft.tsx` 中 `defaultCreate` 函数内调用了 `useLocale()` hook，违反 React Hooks 规则，需在重构时一并修复

## 第4部分：错误处理、测试与迁移策略

### 错误处理

- 表单验证错误：`SizableText` + `color="$red10"` 内联展示
- AI 解析失败 / 网络错误：`@tamagui/toast` Toast 通知

### 通用组件

- `FormField` 用 Tamagui 重写
- ScheduleList、AIConfigForm 本次不动

### 迁移策略

1. 安装依赖、配置 Tamagui（babel、metro、app.json），验证 app 正常启动
2. 逐个重构组件：FormField → MessageInputForm → ScheduleDraftForm
3. 最后处理页面层布局（index.tsx、draft.tsx）
4. 每步保证能编译运行

### 测试

- 测试文件中需添加 `TamaguiProvider` 包裹，确保 Tamagui 组件能正常渲染
- 重构后验证现有测试是否通过
- 测试因组件结构变化失败时同步更新选择器，保持 `accessibilityLabel` 兼容
