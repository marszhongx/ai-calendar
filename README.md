# ai-calendar

一个面向个人用户的跨平台 Expo MVP，用于把自然语言消息解析为单个日程草案，确认后本地保存并调度本地提醒。

## MVP 范围

- 粘贴文本消息
- 调用解析接口获取结构化草案
- 在客户端确认和编辑草案
- 本地保存日程
- 本地通知提醒

当前不包含：

- 多事件拆分
- 外部日历同步
- 账号系统
- 云同步
- 语音输入

## 环境变量

创建 `.env` 并配置：

```bash
EXPO_PUBLIC_PARSE_API_URL=https://example.com/parse
```

可参考 `.env.example`。

## 启动

```bash
npm install
npm run start
```

## 测试

```bash
npm test
npm run typecheck
```

## 当前实现说明

- 路由：Expo Router 三页骨架
- 存储：当前仓库层默认通过 `AsyncStorage` 持久化，并保留内存存储抽象用于测试与替换
- 提醒：当前提醒调度层默认通过 Expo Notifications 调度，并保留可注入 driver 以便测试
- 解析：已封装 parse API 客户端、标准化与校验边界

## 核心验证路径

1. 在输入页输入文本
2. 提交解析请求
3. 在草案页确认或补全字段
4. 创建后在列表页查看结果
5. 调度本地提醒
