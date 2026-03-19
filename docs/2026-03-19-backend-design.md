# AI Calendar Server - Backend Design

## Overview

为 ai-calendar 客户端提供后端服务，将 AI 通信、日程存储、消息推送从客户端迁移到服务端。

## Tech Stack

| 项目 | 选择 |
|---|---|
| 框架 | Next.js API Routes |
| 部署 | Vercel (免费版) |
| 数据库 | Vercel Postgres (Neon) |
| 推送 | Expo Push Service |
| 定时触发 | cron-job.org 每分钟调用 |
| 认证 | 设备级别（无登录） |

## Database

### devices

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | 设备唯一 ID，客户端生成 |
| push_token | text | Expo Push Token |
| platform | text | ios / android |
| created_at | timestamptz | 注册时间 |
| updated_at | timestamptz | 最后活跃时间 |

### schedules

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid PK | 日程 ID |
| device_id | uuid FK | 所属设备 |
| title | text | 标题 |
| start_at | timestamptz | 开始时间 |
| end_at | timestamptz | 结束时间（可空） |
| timezone | text | 时区 |
| reminder_minutes_before | int | 提前提醒分钟数 |
| recurrence | text | NONE / DAILY / WEEKLY / MONTHLY |
| notes | text | 备注 |
| reminder_sent_at | timestamptz | 上次发送提醒的时间（可空） |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

`reminder_sent_at` 用于 cron 判断是否已发送，避免重复推送。

## API

### POST /api/devices

注册设备，上传 push token。已存在则更新 token。

Body: `{ deviceId, pushToken, platform }`

### POST /api/parse

自然语言解析日程。AI 配置（provider、key、model）全部在服务端环境变量。

Body: `{ message, deviceId }`

返回: `{ title, startTime, endTime, timezone, reminderMinutesBefore, recurrence, notes, confidence }`

### GET /api/schedules?deviceId=xxx

查询该设备所有日程。

### POST /api/schedules

创建日程。

### PUT /api/schedules/:id

更新日程。

### DELETE /api/schedules/:id

删除日程。

### POST /api/cron/send-reminders

cron-job.org 每分钟调用，公开访问，无鉴权。

逻辑：
1. 查询待推送日程：`start_at - reminder_minutes_before` 在当前时间往前 1 分钟窗口内
2. 单次日程：`reminder_sent_at` 为空
3. 重复日程：`reminder_sent_at` 距今超过一个周期（DAILY: 24h, WEEKLY: 7d, MONTHLY: 28d）
4. 批量发送 Expo Push（一次最多 100 条）
5. 更新 `reminder_sent_at`

幂等：`reminder_sent_at` 保证同一条不重复发。每次最多处理 100 条，超出的下次处理。

## Project Structure

Monorepo，服务端代码在 `server/` 目录下：

```
ai-calendar/
├── server/
│   ├── app/api/
│   │   ├── devices/route.ts
│   │   ├── parse/route.ts
│   │   ├── schedules/
│   │   │   ├── route.ts              # GET, POST
│   │   │   └── [id]/route.ts         # PUT, DELETE
│   │   └── cron/send-reminders/route.ts
│   ├── lib/
│   │   ├── db.ts                     # @vercel/postgres
│   │   ├── expo-push.ts              # Expo Push API
│   │   └── ai.ts                     # AI SDK
│   ├── package.json
│   └── vercel.json
├── src/                               # 客户端代码
├── app/                               # 客户端路由
└── docs/
```

无 ORM，直接用 `@vercel/postgres` 的 `sql` 模板标签写查询。

客户端改造见 `docs/2026-03-19-client-backend-migration.md`。
