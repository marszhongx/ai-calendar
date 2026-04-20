# ai-calendar

本地优先的 Expo AI 日程助手。用户输入自然语言后，应用调用兼容 OpenAI 的模型生成结构化日程草稿，用户确认或编辑后保存到本地，并通过本地通知进行提醒。

## 功能特性

- 自然语言输入生成日程草稿
- 草稿确认与编辑后再保存
- 日程的创建、查看、编辑、删除
- 支持单次 / 每日 / 每周 / 每月重复日程
- 支持 today / tomorrow / all 视图
- 已过期日程不会出现在 today / tomorrow 中，并会在 all 中显示过期样式
- 支持 en、zh、zh-TW
- 支持配置兼容 OpenAI 的 base URL、API key、model

## 技术栈

- Expo 55
- React Native 0.83 + React 19
- Expo Router
- Tamagui 2.0 RC
- AsyncStorage
- `ai` SDK + `@ai-sdk/openai`
- Zod
- Jest + Testing Library
- TypeScript + Biome

## 快速开始

```bash
npm install
npm start
npm run ios
npm run android
npm run web
```

Expo 开发服务器默认运行在 `4398` 端口。

## AI 配置

在应用内配置页填写或修改 base URL、API key 和 model。
这些配置会保存在本地设备的 AsyncStorage 中。

## 实现逻辑

1. 用户输入自然语言描述
2. 应用调用已配置的兼容 OpenAI 模型
3. 返回结果被整理为可编辑的日程草稿
4. 用户确认或修改草稿
5. 日程保存到本地
6. 应用在 today / tomorrow / all 视图中展示日程
7. 提醒通过设备本地通知触发

## 本地存储

- `schedules`：保存日程数据
- `ai-config`：保存 AI 配置

## 测试与检查

```bash
npm test
npm run typecheck
npm run lint
```

代码修改后应通过：

```bash
npm run typecheck && npm run lint
```

## 当前限制

- 仅本地存储，不含账号系统
- 不支持云同步
- 不支持外部日历同步
- 不支持多事件拆分
