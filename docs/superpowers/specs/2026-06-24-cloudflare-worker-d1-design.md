# AI 情绪日记 Cloudflare Worker + D1 接入设计

## 目标

在不改变现有前端视觉效果和交互结构的前提下，为 AI 情绪日记接入 Cloudflare 基础设施：

- 使用 Cloudflare Worker 提供 HTTP API。
- 使用 Cloudflare D1 持久化情绪日记数据。
- 使用 Wrangler 进行本地开发、数据库迁移和部署。
- 将服务端密钥保存在 Cloudflare Secrets 中，不暴露给浏览器。
- 保持前端代码可独立修改和迭代。

## 当前项目

项目当前由静态 HTML、图片资源和 Node 测试文件组成：

- `ai-emotion-diary-prototype.html`：主要前端原型。
- `project-overview.html`：项目说明页面。
- `assets/`：视觉资源。
- `prototype.test.mjs` 和 `overview.test.mjs`：现有测试。

接入时保留这些文件，并在外围增加 Worker、D1 和构建配置。

## 推荐架构

浏览器访问由 Cloudflare Worker 托管的静态前端。前端通过同域 `/api/*` 请求 Worker API，Worker 使用 D1 binding 直接访问数据库。

```text
Browser
  ├── GET /                     -> Static HTML/assets
  └── /api/entries/*            -> Cloudflare Worker
                                      └── env.DB -> Cloudflare D1
```

同域部署可以避免额外的 CORS 配置，也便于以后更换前端框架。

## 项目结构

计划增加以下文件：

```text
ai-emotion-diary/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   └── index.ts
├── migrations/
│   └── 0001_create_entries.sql
├── test/
│   └── api.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.mts
└── wrangler.jsonc
```

现有原型会复制到 `public/index.html`，原文件保留，方便对照和继续修改。

## 数据模型

首个版本只创建一张 `entries` 表：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | TEXT | UUID 主键 |
| `content` | TEXT | 日记正文 |
| `mood` | TEXT | 情绪标签 |
| `intensity` | INTEGER | 情绪强度，1–5 |
| `ai_response` | TEXT | 可选的 AI 回应 |
| `created_at` | TEXT | ISO 8601 创建时间 |
| `updated_at` | TEXT | ISO 8601 更新时间 |

对 `created_at` 建立索引，以支持按时间倒序读取。

## API

首个版本提供以下接口：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | 检查 Worker 和 D1 状态 |
| `GET` | `/api/entries` | 获取日记列表 |
| `GET` | `/api/entries/:id` | 获取单条日记 |
| `POST` | `/api/entries` | 新建日记 |
| `PUT` | `/api/entries/:id` | 修改日记 |
| `DELETE` | `/api/entries/:id` | 删除日记 |

API 统一返回 JSON。创建和修改请求会校验正文、情绪强度及字段长度，并使用 prepared statements 防止 SQL 注入。

## AI 接口边界

本次先预留服务端 AI 调用位置和 Secret 配置，不绑定特定模型供应商。未来接入 OpenAI、Workers AI 或其他服务时，浏览器只请求 Worker，由 Worker 读取 Secret 并调用模型。

任何 AI API Key 都不会写入 HTML、客户端 JavaScript、Git 或 `wrangler.jsonc`。

## 本地与远程环境

- Wrangler 安装为项目开发依赖，通过 `npx wrangler` 或 npm scripts 调用。
- 本地开发使用 Wrangler 的本地 D1 数据。
- 数据库结构通过 migrations 管理。
- 用户完成 Cloudflare 浏览器登录后，再创建远程 D1、应用 migration 并部署 Worker。
- 本地和远程数据库相互独立，避免测试数据污染线上。

## 错误处理

- 请求格式错误返回 `400`。
- 日记不存在返回 `404`。
- 不支持的方法返回 `405`。
- 未预期的服务端或数据库错误返回 `500`，不向客户端泄露密钥、SQL 或内部堆栈。
- Worker 日志保留足够的错误上下文用于 Wrangler 调试。

## 测试与验收

实现完成后验证：

1. 现有前端测试继续通过。
2. API 对创建、读取、修改、删除和输入校验有自动化测试。
3. D1 migration 能在本地空数据库成功执行。
4. `wrangler dev` 可同时提供静态页面与 API。
5. 使用浏览器完成一次新增、刷新后读取、编辑和删除流程。
6. 用户登录 Cloudflare 后，远程 migration 和部署成功。

## 免费额度

该架构面向个人原型和早期产品。Cloudflare 当前免费计划包含 Workers 和 D1 的有限额度；D1 免费额度包括每日 500 万行读取、10 万行写入及总计 5 GB 存储。代码会使用索引和分页，减少不必要的行扫描。

## 本次范围之外

首个接入版本暂不包含：

- 用户注册和登录。
- 多用户数据隔离。
- 付费系统。
- 文件或图片上传。
- 向量搜索。
- 自动选择或购买 AI 模型。

这些能力可以在基本 CRUD 和部署链路稳定后独立增加。
