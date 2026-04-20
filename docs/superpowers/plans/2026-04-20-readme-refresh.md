# README Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `README.md` so it matches the current local-only Expo implementation and removes obsolete client/server/backend documentation.

**Architecture:** This is a documentation-only change centered on a full rewrite of the top-level `README.md`. The new README should be user-first, with only light implementation notes covering the high-level flow, local storage, AI configuration, and current limitations.

**Tech Stack:** Markdown, npm scripts, Expo 55, React Native, AsyncStorage, `ai` SDK, Biome

---

## File Structure

- Modify: `README.md` — replace the outdated client/server description with the current local-only app description
- Reference: `package.json` — source of the current runnable scripts
- Reference: `CLAUDE.md` — source of the current architecture summary and required verification commands
- Reference: `docs/superpowers/specs/2026-04-20-readme-refresh-design.md` — approved scope and section design

### Task 1: Replace the outdated README structure

**Files:**
- Modify: `README.md`
- Reference: `package.json`
- Reference: `CLAUDE.md`

- [ ] **Step 1: Rewrite `README.md` with the new section order**

Use this section order and keep the tone lightweight:

```md
# ai-calendar

[short summary]

## 功能特性
- ...

## 技术栈
- ...

## 快速开始
```bash
npm install
npm start
npm run ios
npm run android
npm run web
```

## AI 配置
- ...

## 实现逻辑
1. ...
2. ...

## 本地存储
- ...

## 测试与检查
```bash
npm test
npm run typecheck
npm run lint
npm run typecheck && npm run lint
```

## 当前限制
- ...
```

- [ ] **Step 2: Replace the opening summary and feature list with current behavior**

Use content equivalent to the following and remove all backend claims:

```md
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
```

Expected result: `README.md` no longer mentions server parsing, database persistence, cron delivery, or workspace layout.

- [ ] **Step 3: Replace startup, configuration, flow, storage, and limitations sections**

Use content equivalent to the following:

```md
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

## 当前限制
- 仅本地存储，不含账号系统
- 不支持云同步
- 不支持外部日历同步
- 不支持多事件拆分
```

Expected result: all API route tables, `.env` backend examples, and server lifecycle descriptions are removed.

### Task 2: Verify the rewritten README matches the repo

**Files:**
- Modify: `README.md`
- Reference: `package.json`
- Reference: `CLAUDE.md`

- [ ] **Step 1: Read the final `README.md` and scan for stale terms**

Search for and remove any remaining outdated terms such as:

```text
client/
server/
Next.js
API
Vercel Postgres
cron
push token
workspace
```

Expected result: none of those terms remain unless they are part of a clearly current statement.

- [ ] **Step 2: Verify the commands listed in `README.md` exist in `package.json`**

Check that the README only documents these current scripts:

```json
{
  "start": "expo start --port 4398",
  "android": "expo start --android --port 4398",
  "ios": "expo start --ios --port 4398",
  "web": "expo start --web --port 4398",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "lint": "biome check ."
}
```

Expected result: every command shown in the README exists exactly once in `package.json`.

- [ ] **Step 3: Verify the high-level logic matches current project guidance**

Check the README against these current facts from `CLAUDE.md`:

```md
- Local-only Expo app
- AsyncStorage stores schedules and ai-config
- AI parsing uses `ai` SDK + `@ai-sdk/openai`
- Reminders use local notifications
- Pages include list, new, draft, detail, config
```

Expected result: the README stays high-level but does not contradict any of these facts.

### Task 3: Run required verification and review the diff

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the required repository verification commands**

Run:

```bash
npm run typecheck && npm run lint
```

Expected result: both commands pass.

- [ ] **Step 2: Review the final diff for scope control**

Run:

```bash
git diff -- README.md docs/superpowers/specs/2026-04-20-readme-refresh-design.md docs/superpowers/plans/2026-04-20-readme-refresh.md
```

Expected result: the diff only contains the approved README rewrite plus the spec/plan documents already created for this work.

- [ ] **Step 3: Prepare the work for user review**

Summarize the final change in one short paragraph using content equivalent to:

```text
README 已从旧的 client/server 文档改为当前的本地 Expo 应用说明，保留快速开始、AI 配置、实现逻辑、本地存储和当前限制，并删除了所有已过时的后端/API/数据库/Cron 叙述。
```

Expected result: the user can review the rewritten README without needing extra architectural explanation.

## Self-Review

- Spec coverage: the plan covers removal of old backend content, replacement with current local-only behavior, lightweight flow explanation, current commands, storage, and limitations.
- Placeholder scan: no TODO/TBD markers remain.
- Type consistency: command names, storage keys, and product terms match the currently observed repository state.
