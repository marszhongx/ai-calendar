# ai-calendar

跨平台 AI 日程助手。用户输入自然语言描述，服务端 AI 解析为结构化日程，客户端确认后保存，服务端定时推送提醒。

## 项目结构

```
ai-calendar/
├── app/                # Expo Router 页面（客户端）
├── src/                # 客户端业务代码
├── server/             # Next.js 后端 API
└── docs/               # 设计文档
```

## 功能

- 自然语言输入，AI 解析为日程草案
- 客户端确认 / 编辑草案后保存
- 服务端持久化存储（Vercel Postgres）
- 定时推送提醒（Expo Push + 服务端 Cron）
- 支持单次 / 每日 / 每周 / 每月重复日程
- 多语言（en、zh、zh-TW）

当前不包含：多事件拆分、外部日历同步、账号系统、语音输入。

## 环境变量

**客户端** — 创建根目录 `.env`：

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

**服务端** — 创建 `server/.env`：

```bash
POSTGRES_URL=
AI_API_KEY=
AI_PROVIDER=openai
AI_MODEL_NAME=grok-4-1-fast-non-reasoning
AI_BASE_URL=https://yunwu.ai/v1
```

## 启动

```bash
npm install
cd server && npm install && cd ..
npm start              # 启动 Expo 客户端
npm run server         # 启动服务端 (Next.js, 端口 3001)
```

## 测试

```bash
npm test               # 客户端测试 (Jest)
npm run typecheck      # TypeScript 类型检查
cd server && npm test  # 服务端测试 (Vitest)
```

## 核心流程

1. 应用启动 → 生成设备 ID，上传 Push Token 到服务端
2. 用户输入自然语言 → 服务端 AI 解析 → 返回结构化草案
3. 用户确认 / 编辑草案 → 提交保存到服务端数据库
4. 在列表页查看、编辑、删除日程
5. 服务端 Cron 每分钟检查到期提醒 → 推送 Expo Push 通知

## API 端点

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/devices` | POST | 注册设备 & 上传 Push Token |
| `/api/parse` | POST | AI 解析自然语言为日程 |
| `/api/schedules` | GET | 获取设备的日程列表 |
| `/api/schedules` | POST | 创建日程 |
| `/api/schedules/[id]` | PUT | 更新日程 |
| `/api/schedules/[id]` | DELETE | 删除日程 |
| `/api/cron/send-reminders` | POST | Cron 触发，发送到期提醒 |
