# AI Calendar Client - Backend Migration Design

## Overview

将客户端从本地模式迁移到服务端模式：AI 解析、日程存储、消息推送全部走服务端 API。

## API Base

服务端地址通过环境变量 `EXPO_PUBLIC_API_BASE_URL` 配置。

## Device Identity

- 启动时检查 AsyncStorage 中是否有 `deviceId`
- 没有则生成 UUID 并存入
- 所有 API 请求携带 `deviceId`

## Push Token 注册

- 启动时调用 `Notifications.getExpoPushTokenAsync()` 获取 Expo Push Token
- 调用 `POST /api/devices` 上报 `{ deviceId, pushToken, platform }`
- Token 变化时重新上报

## services/index.ts

统一的 API 调用层，替代原来分散的本地逻辑：

```ts
// 设备注册
registerDevice(deviceId, pushToken, platform)

// AI 解析
parseMessage(message, deviceId) → ScheduleDraft

// 日程 CRUD
listSchedules(deviceId) → Schedule[]
createSchedule(schedule) → Schedule
updateSchedule(id, schedule) → Schedule
deleteSchedule(id)
```

内部封装：
- `EXPO_PUBLIC_API_BASE_URL` 作为 baseUrl
- 统一错误处理，返回 Result 类型
- 请求超时 30 秒

## 删除的文件

| 文件 | 原因 |
|---|---|
| `services/ai.ts` | AI 调用移到服务端 |
| `services/schedule-parse.ts` | 由 `services/index.ts` 调 `POST /api/parse` 替代 |
| `services/schedule-repository.ts` | 由 `services/index.ts` 调服务端 CRUD 替代 |
| `services/schedule-reminders.ts` | 推送由服务端 cron 处理 |
| `config/ai-config.ts` | AI 配置移到服务端环境变量 |
| `lib/storage.ts` | 不再用 AsyncStorage 存日程 |
| `app/config.tsx` | 不再需要客户端 AI 配置页面 |

## 删除的依赖

- `@ai-sdk/google`
- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `ai`
- `zod`（仅服务端 AI 解析用到）

## 保留不变

- UI 组件（`components/`）
- 路由页面（`app/index.tsx`、`app/draft.tsx`、`app/new.tsx`、`app/schedule/[id].tsx`）
- i18n、主题、类型定义
- `utils/schedule-normalizer.ts` — 仍在客户端对服务端返回数据做标准化
- `utils/schedule-validation.ts` — 提交前客户端校验

## 页面改造

### app/_layout.tsx
- 启动时执行设备注册 + push token 上报

### app/new.tsx
- `parseMessageWithAI()` → `parseMessage()` 调服务端

### app/draft.tsx
- `createScheduleRepository().createSchedule()` → `createSchedule()` 调服务端
- 删除 `createReminderScheduler()` 调用

### app/index.tsx
- `createScheduleRepository().listSchedules()` → `listSchedules()` 调服务端
- `createScheduleRepository().deleteSchedule()` → `deleteSchedule()` 调服务端
- 删除 `createReminderScheduler()` 调用

### app/schedule/[id].tsx
- `createScheduleRepository().getScheduleById()` → 从列表传参或单独查询
- `createScheduleRepository().updateSchedule()` → `updateSchedule()` 调服务端
- 删除 `createReminderScheduler()` 调用
