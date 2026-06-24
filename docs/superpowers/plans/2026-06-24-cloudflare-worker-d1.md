# Cloudflare Worker + D1 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 AI 情绪日记静态原型部署为 Cloudflare Worker 应用，并用 D1 API 持久化日记。

**Architecture:** Worker 同时提供静态资源和同域 `/api/*` 路由。API 路由调用独立的 entry service，通过 `env.DB` D1 binding 执行 prepared statements；浏览器端保留现有视觉和生成共鸣卡逻辑，只把历史记录从 `localStorage` 改为 API。

**Tech Stack:** TypeScript, Cloudflare Workers, Wrangler 4, D1/SQLite, Vitest, `@cloudflare/vitest-pool-workers`

---

## 文件职责

- `package.json`：固定 Wrangler、TypeScript、Vitest 依赖和开发命令。
- `wrangler.jsonc`：Worker 入口、静态资源和 D1 binding 配置。
- `tsconfig.json`：Worker TypeScript 编译规则。
- `vitest.config.mts`：Cloudflare Workers 测试运行环境。
- `src/index.ts`：请求入口、路由和统一错误响应。
- `src/entries.ts`：日记输入校验和 D1 CRUD。
- `src/types.ts`：环境、日记和请求类型。
- `migrations/0001_create_entries.sql`：创建 `entries` 表和时间索引。
- `test/api.test.ts`：使用本地 D1 binding 验证 API。
- `public/index.html`：可部署的现有前端。
- `public/assets/mood-visual-sheet.png`：前端图像资源。
- `prototype.test.mjs`：继续保护原始原型结构。
- `public.test.mjs`：保护部署版前端的 API 接入。
- `.gitignore`：忽略依赖、Wrangler 本地状态和密钥文件。
- `README.md`：本地开发、登录、迁移和部署命令。

### Task 1: 建立项目工具链

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `wrangler.jsonc`

- [ ] **Step 1: 写入项目清单**

创建 `package.json`：

```json
{
  "name": "ai-emotion-diary",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types",
    "db:migrate:local": "wrangler d1 migrations apply emotion-diary-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply emotion-diary-db --remote",
    "test": "npm run test:legacy && vitest run",
    "test:legacy": "node prototype.test.mjs && node overview.test.mjs && node public.test.mjs"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "latest",
    "typescript": "latest",
    "vitest": "latest",
    "wrangler": "latest"
  }
}
```

- [ ] **Step 2: 写入 Worker 配置**

创建 `wrangler.jsonc`：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ai-emotion-diary",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-24",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "emotion-diary-db",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ]
}
```

远程数据库创建后，将本地占位 UUID `00000000-0000-0000-0000-000000000000` 替换为 Wrangler 返回的真实 UUID。

- [ ] **Step 3: 写入 TypeScript 与忽略规则**

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "WebWorker"],
    "strict": true,
    "noEmit": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src", "test", "worker-configuration.d.ts"]
}
```

在 `package.json` 的 `devDependencies` 同时加入：

```json
"@cloudflare/workers-types": "latest"
```

创建 `.gitignore`：

```gitignore
node_modules/
.wrangler/
.dev.vars
.env
coverage/
worker-configuration.d.ts
```

- [ ] **Step 4: 安装并验证 Wrangler**

Run: `npm install`

Expected: 依赖安装成功并生成 `package-lock.json`。

Run: `npx wrangler --version`

Expected: 输出 Wrangler 4.x 版本。

- [ ] **Step 5: 提交**

```bash
git add .gitignore package.json package-lock.json tsconfig.json wrangler.jsonc
git commit -m "chore: add Cloudflare Workers toolchain"
```

### Task 2: 创建 D1 schema

**Files:**
- Create: `migrations/0001_create_entries.sql`
- Create: `test/schema.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 写失败的 schema 测试**

创建 `test/schema.test.mjs`：

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  new URL("../migrations/0001_create_entries.sql", import.meta.url),
  "utf8",
);

for (const fragment of [
  "CREATE TABLE IF NOT EXISTS entries",
  "id TEXT PRIMARY KEY",
  "content TEXT NOT NULL",
  "mood TEXT NOT NULL",
  "intensity INTEGER NOT NULL",
  "ai_response TEXT",
  "created_at TEXT NOT NULL",
  "updated_at TEXT NOT NULL",
  "CREATE INDEX IF NOT EXISTS idx_entries_created_at",
]) {
  assert.ok(sql.includes(fragment), `Missing schema fragment: ${fragment}`);
}

console.log("D1 schema checks passed.");
```

将 `test:legacy` 更新为：

```json
"test:legacy": "node prototype.test.mjs && node overview.test.mjs && node public.test.mjs && node test/schema.test.mjs"
```

- [ ] **Step 2: 验证测试失败**

Run: `node test/schema.test.mjs`

Expected: FAIL，提示找不到 `migrations/0001_create_entries.sql`。

- [ ] **Step 3: 写 migration**

创建 `migrations/0001_create_entries.sql`：

```sql
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 400),
  mood TEXT NOT NULL CHECK(mood IN ('happy', 'calm', 'anxious', 'sad', 'tired', 'angry')),
  intensity INTEGER NOT NULL CHECK(intensity BETWEEN 1 AND 5),
  ai_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_created_at
ON entries(created_at DESC);
```

- [ ] **Step 4: 验证 schema 与本地 migration**

Run: `node test/schema.test.mjs`

Expected: `D1 schema checks passed.`

Run: `npm run db:migrate:local`

Expected: migration `0001_create_entries.sql` 成功应用。

- [ ] **Step 5: 提交**

```bash
git add package.json migrations/0001_create_entries.sql test/schema.test.mjs
git commit -m "feat: add D1 entries schema"
```

### Task 3: 以测试驱动实现 API

**Files:**
- Create: `src/types.ts`
- Create: `src/entries.ts`
- Create: `src/index.ts`
- Create: `test/api.test.ts`
- Create: `vitest.config.mts`

- [ ] **Step 1: 配置 Workers Vitest**

创建 `vitest.config.mts`：

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          d1Databases: ["DB"],
        },
      },
    },
  },
});
```

- [ ] **Step 2: 写 API 失败测试**

创建 `test/api.test.ts`，在 `beforeEach` 中创建表并清空数据，然后测试：

```ts
import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(async () => {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      mood TEXT NOT NULL,
      intensity INTEGER NOT NULL,
      ai_response TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    DELETE FROM entries;
  `);
});

describe("entries API", () => {
  it("reports a healthy D1 binding", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("creates and lists an entry", async () => {
    const created = await SELF.fetch("https://example.com/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "今天的风很舒服。",
        mood: "calm",
        intensity: 3,
        aiResponse: "允许自己慢一点。",
      }),
    });
    expect(created.status).toBe(201);
    const entry = await created.json();
    expect(entry.id).toBeTypeOf("string");

    const listed = await SELF.fetch("https://example.com/api/entries");
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual([entry]);
  });

  it("gets, updates, and deletes an entry", async () => {
    const created = await SELF.fetch("https://example.com/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "原文", mood: "sad", intensity: 2 }),
    });
    const entry = await created.json();

    const fetched = await SELF.fetch(`https://example.com/api/entries/${entry.id}`);
    expect(fetched.status).toBe(200);

    const updated = await SELF.fetch(`https://example.com/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "修改后", mood: "calm", intensity: 3 }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).content).toBe("修改后");

    const removed = await SELF.fetch(`https://example.com/api/entries/${entry.id}`, {
      method: "DELETE",
    });
    expect(removed.status).toBe(204);

    const missing = await SELF.fetch(`https://example.com/api/entries/${entry.id}`);
    expect(missing.status).toBe(404);
  });

  it("rejects invalid input", async () => {
    const response = await SELF.fetch("https://example.com/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "", mood: "unknown", intensity: 9 }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid entry" });
  });
});
```

- [ ] **Step 3: 验证 API 测试失败**

Run: `npx vitest run test/api.test.ts`

Expected: FAIL，因为 `src/index.ts` 尚不存在或 API 返回 404。

- [ ] **Step 4: 定义类型和 CRUD**

创建 `src/types.ts`：

```ts
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export interface Entry {
  id: string;
  content: string;
  mood: string;
  intensity: number;
  aiResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntryInput {
  content: string;
  mood: string;
  intensity: number;
  aiResponse?: string | null;
}
```

创建 `src/entries.ts`，导出：

```ts
import type { Entry, EntryInput } from "./types";

const moods = new Set(["happy", "calm", "anxious", "sad", "tired", "angry"]);

export function isEntryInput(value: unknown): value is EntryInput {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.content === "string" &&
    item.content.trim().length >= 1 &&
    item.content.trim().length <= 400 &&
    typeof item.mood === "string" &&
    moods.has(item.mood) &&
    Number.isInteger(item.intensity) &&
    Number(item.intensity) >= 1 &&
    Number(item.intensity) <= 5 &&
    (item.aiResponse === undefined ||
      item.aiResponse === null ||
      (typeof item.aiResponse === "string" && item.aiResponse.length <= 2000))
  );
}

interface EntryRow {
  id: string;
  content: string;
  mood: string;
  intensity: number;
  ai_response: string | null;
  created_at: string;
  updated_at: string;
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    content: row.content,
    mood: row.mood,
    intensity: row.intensity,
    aiResponse: row.ai_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEntries(db: D1Database): Promise<Entry[]> {
  const result = await db
    .prepare("SELECT * FROM entries ORDER BY created_at DESC LIMIT 50")
    .all<EntryRow>();
  return result.results.map(toEntry);
}

export async function getEntry(
  db: D1Database,
  id: string,
): Promise<Entry | null> {
  const row = await db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .bind(id)
    .first<EntryRow>();
  return row ? toEntry(row) : null;
}

export async function createEntry(
  db: D1Database,
  input: EntryInput,
): Promise<Entry> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO entries
       (id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.content.trim(),
      input.mood,
      input.intensity,
      input.aiResponse ?? null,
      now,
      now,
    )
    .run();
  return (await getEntry(db, id))!;
}

export async function updateEntry(
  db: D1Database,
  id: string,
  input: EntryInput,
): Promise<Entry | null> {
  const existing = await getEntry(db, id);
  if (!existing) return null;
  await db
    .prepare(
      `UPDATE entries
       SET content = ?, mood = ?, intensity = ?, ai_response = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      input.content.trim(),
      input.mood,
      input.intensity,
      input.aiResponse ?? null,
      new Date().toISOString(),
      id,
    )
    .run();
  return getEntry(db, id);
}

export async function deleteEntry(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM entries WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
```

- [ ] **Step 5: 实现路由**

创建 `src/index.ts`：

```ts
import {
  createEntry,
  deleteEntry,
  getEntry,
  isEntryInput,
  listEntries,
  updateEntry,
} from "./entries";
import type { Env } from "./types";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        await env.DB.prepare("SELECT 1").first();
        return json({ ok: true });
      }

      if (url.pathname === "/api/entries") {
        if (request.method === "GET") return json(await listEntries(env.DB));
        if (request.method === "POST") {
          const input: unknown = await request.json();
          if (!isEntryInput(input)) return json({ error: "Invalid entry" }, 400);
          return json(await createEntry(env.DB, input), 201);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      const match = url.pathname.match(/^\\/api\\/entries\\/([^/]+)$/);
      if (match) {
        const id = decodeURIComponent(match[1]);
        if (request.method === "GET") {
          const entry = await getEntry(env.DB, id);
          return entry ? json(entry) : json({ error: "Entry not found" }, 404);
        }
        if (request.method === "PUT") {
          const input: unknown = await request.json();
          if (!isEntryInput(input)) return json({ error: "Invalid entry" }, 400);
          const entry = await updateEntry(env.DB, id, input);
          return entry ? json(entry) : json({ error: "Entry not found" }, 404);
        }
        if (request.method === "DELETE") {
          const removed = await deleteEntry(env.DB, id);
          return removed
            ? new Response(null, { status: 204 })
            : json({ error: "Entry not found" }, 404);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Worker request failed", error);
      return json({ error: "Internal server error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 6: 验证 API**

Run: `npx vitest run test/api.test.ts`

Expected: 4 tests PASS。

Run: `npx tsc --noEmit`

Expected: 无 TypeScript 错误。

- [ ] **Step 7: 提交**

```bash
git add src test/api.test.ts vitest.config.mts
git commit -m "feat: add D1 diary entries API"
```

### Task 4: 创建部署版前端并接入 API

**Files:**
- Create: `public/index.html`
- Create: `public/assets/mood-visual-sheet.png`
- Create: `public.test.mjs`

- [ ] **Step 1: 复制现有前端与资源**

Run:

```bash
mkdir -p public/assets
cp ai-emotion-diary-prototype.html public/index.html
cp assets/mood-visual-sheet.png public/assets/mood-visual-sheet.png
```

Expected: 原始原型保持不变，部署版文件已创建。

- [ ] **Step 2: 写失败的前端接入测试**

创建 `public.test.mjs`：

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");

for (const text of [
  'fetch("/api/entries"',
  "async function loadHistory",
  "async function saveEntry",
  "response.ok",
  "保存失败",
]) {
  assert.ok(html.includes(text), `Expected deployed frontend to include: ${text}`);
}

assert.ok(
  !html.includes('localStorage.setItem(storageKey'),
  "Deployed frontend should persist through D1 API.",
);

console.log("Deployed frontend API checks passed.");
```

- [ ] **Step 3: 验证接入测试失败**

Run: `node public.test.mjs`

Expected: FAIL，缺少 `fetch("/api/entries"`。

- [ ] **Step 4: 替换部署版存储函数**

只修改 `public/index.html`。保留 mood profile、卡片生成和视觉 CSS，将历史存储逻辑替换为：

```js
async function loadHistory() {
  const response = await fetch("/api/entries", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("读取历史失败");
  return response.json();
}

async function saveEntry(entry) {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: entry.diary,
      mood: entry.mood,
      intensity: 3,
      aiResponse: entry.note,
    }),
  });
  if (!response.ok) throw new Error("保存失败");
  return response.json();
}
```

`renderHistory` 改为接收 API 返回的 `content`、`mood`、`createdAt` 字段，并在插入 HTML 前通过 DOM `textContent` 或 `escapeHtml` 处理用户正文。

保存按钮监听器改为 `async`，调用 `saveEntry(currentResult)` 后重新 `await refreshHistory()`。清空历史不再提供批量删除；按钮改为“刷新历史”，调用 `refreshHistory()`，避免加入未经设计的危险批量 API。

页面初始化调用：

```js
async function refreshHistory() {
  try {
    renderHistory(await loadHistory());
  } catch (error) {
    historyList.innerHTML = '<p class="empty-state">历史暂时读取失败，请稍后重试。</p>';
    console.error(error);
  }
}

refreshHistory();
```

- [ ] **Step 5: 验证前端**

Run: `node prototype.test.mjs`

Expected: 原始原型检查 PASS。

Run: `node public.test.mjs`

Expected: 部署版 API 检查 PASS。

- [ ] **Step 6: 提交**

```bash
git add public public.test.mjs
git commit -m "feat: connect diary frontend to Worker API"
```

### Task 5: 本地端到端验证

**Files:**
- Modify only if verification exposes a defect.

- [ ] **Step 1: 运行完整自动化测试**

Run: `npm test`

Expected: legacy、schema 和 Workers API 测试全部 PASS。

- [ ] **Step 2: 启动本地 Worker**

Run: `npm run dev`

Expected: Wrangler 输出本地 URL，通常为 `http://localhost:8787`。

- [ ] **Step 3: 验证健康检查与首页**

Run: `curl -i http://localhost:8787/api/health`

Expected: HTTP 200 和 `{"ok":true}`。

Run: `curl -I http://localhost:8787/`

Expected: HTTP 200，内容类型为 HTML。

- [ ] **Step 4: 浏览器验证完整流程**

打开本地 URL，验证：

1. 原页面布局和情绪选项正常。
2. 生成今日共鸣卡。
3. 保存日记后历史区域出现记录。
4. 刷新页面后记录仍在。
5. API 失败时页面显示中文错误状态，且控制台无密钥。

- [ ] **Step 5: 提交验证修复**

如果有修复：

```bash
git add src public test
git commit -m "fix: resolve local Worker integration issues"
```

若无修复则不创建空提交。

### Task 6: 文档化 Cloudflare 登录和部署

**Files:**
- Create: `README.md`

- [ ] **Step 1: 写 README**

README 必须包含以下准确命令：

```bash
npm install
npm run db:migrate:local
npm run dev
npx wrangler login
npx wrangler whoami
npx wrangler d1 create emotion-diary-db
npm run db:migrate:remote
npm run deploy
```

同时说明：

- `wrangler d1 create` 返回的 `database_id` 必须写入 `wrangler.jsonc`。
- `.dev.vars` 仅用于本地密钥且被 Git 忽略。
- 线上密钥通过 `npx wrangler secret put SECRET_NAME` 设置。
- 修改 `public/index.html` 后重新运行 `npm run deploy` 即可更新前端。
- 修改 API 后同样运行 `npm run deploy`。

- [ ] **Step 2: 验证文档命令存在**

Run:

```bash
rg -n "wrangler login|d1 create|db:migrate:remote|wrangler secret put|npm run deploy" README.md
```

Expected: 每个部署关键命令均至少出现一次。

- [ ] **Step 3: 提交**

```bash
git add README.md
git commit -m "docs: add Cloudflare development and deployment guide"
```

### Task 7: 创建远程 D1 并部署

**Files:**
- Modify: `wrangler.jsonc`

- [ ] **Step 1: 登录 Cloudflare**

Run: `npx wrangler login`

Expected: 浏览器打开 Cloudflare 授权页；用户完成登录后终端显示成功。

- [ ] **Step 2: 确认账户**

Run: `npx wrangler whoami`

Expected: 输出已登录账户和 Account ID。

- [ ] **Step 3: 创建远程数据库**

Run: `npx wrangler d1 create emotion-diary-db`

Expected: 返回数据库 UUID 和 binding 配置。将 UUID 写入 `wrangler.jsonc` 的 `database_id`。

- [ ] **Step 4: 应用远程 migration**

Run: `npm run db:migrate:remote`

Expected: `0001_create_entries.sql` 成功应用到远程 D1。

- [ ] **Step 5: 部署**

Run: `npm run deploy`

Expected: Wrangler 返回该账户下完整的 `workers.dev` 部署 URL。

- [ ] **Step 6: 验证线上服务**

Run:

```bash
DEPLOYMENT_URL="Wrangler 输出的完整 workers.dev URL"
curl -i "$DEPLOYMENT_URL/api/health"
```

Expected: HTTP 200 和 `{"ok":true}`。

浏览器访问线上 URL，创建一条测试日记并刷新，确认数据仍然存在。

- [ ] **Step 7: 最终提交**

```bash
git add wrangler.jsonc
git commit -m "chore: bind production D1 database"
```

Run: `git status --short`

Expected: 仅剩用户原有但未纳入版本控制的文件，或工作区干净；没有 `.dev.vars`、密钥或 `.wrangler` 文件被跟踪。
