# AI 情绪日记

一个部署在 Cloudflare 上的情绪日记原型。整体采用同域架构：

```text
浏览器
  ├─ 静态前端（public/）
  └─ /api/* → Cloudflare Worker → D1
```

Worker 同时提供静态前端和 API，因此浏览器无需额外配置 CORS。

## 环境要求

- Node.js `^22.12.0 || >=24.0.0`
- npm
- Cloudflare 账号

## 本地开发

```bash
npm install
npm run db:migrate:local
npm run dev
```

运行测试：

```bash
npm test
```

本地 D1 数据与线上 D1 相互独立。

## Cloudflare 配置与部署

当前项目已经绑定线上 D1 数据库：

- database_name: `emotion-diary-db`
- database_id: `fe1a9368-33f6-447f-97e1-3df36e6d5663`
- 已部署地址：<https://ai-emotion-diary.freya-lab.workers.dev>

正常继续部署时，先登录并确认当前账号：

```bash
npx wrangler login
npx wrangler whoami
```

随后执行线上迁移并部署：

```bash
npm run db:migrate:remote
npm run deploy
```

只有在更换 Cloudflare 账号、重建生产环境或创建另一套环境时，才需要新建 D1 数据库：

```bash
npx wrangler d1 create emotion-diary-db
```

命令会返回新的 `database_id`，再把 `wrangler.jsonc` 中的 `database_id` 替换为新值。

修改 `public/index.html` 或 `src/` 下的代码后，需要再次运行 `npm run deploy` 才会更新线上版本。

原始原型保留在 `ai-emotion-diary-prototype.html`，实际部署入口是 `public/index.html`。

## 安全状态

日记 API 使用 `DIARY_ACCESS_TOKEN` 口令保护。`/api/health` 仍然公开用于健康检查；`/api/entries` 和单条日记读写都需要浏览器带上正确口令。

本地开发时，在项目根目录创建 `.dev.vars`：

```dotenv
DIARY_ACCESS_TOKEN=your-local-token
DEEPSEEK_API_KEY=your-deepseek-api-key
```

线上部署前，将同名 Secret 写入 Cloudflare：

```bash
npx wrangler secret put DIARY_ACCESS_TOKEN
npx wrangler secret put DEEPSEEK_API_KEY
```

第一次打开页面或口令失效时，浏览器会提示输入“日记访问口令”。口令只保存在当前浏览器会话的 `sessionStorage` 中；关闭标签页或浏览器后可能需要重新输入。

这不是完整账号系统。如果以后要长期存放真实隐私内容，建议升级到 Cloudflare Access，用邮箱或身份提供商保护整个站点。

## Secret

本地 Secret 写入项目根目录的 `.dev.vars`；该文件已被 Git 忽略。例如：

```dotenv
SECRET_NAME=your-secret-value
```

线上 Secret 使用 Wrangler 写入：

```bash
npx wrangler secret put SECRET_NAME
```

不要将 Secret 放入浏览器端代码、HTML、`wrangler.jsonc` 或 Git 仓库。

`DEEPSEEK_API_KEY` 只在 Cloudflare Worker 后端读取。浏览器端通过同域
`/api/analyze` 请求生成情绪分析，因此 DeepSeek key 不会出现在
`public/index.html` 或用户浏览器里。

## API

创建和更新日记时，请求体为 JSON：

```json
{
  "content": "今天感觉很好",
  "mood": "happy",
  "intensity": 4,
  "aiResponse": null
}
```

`mood` 可取 `happy`、`calm`、`anxious`、`sad`、`tired`、`angry`；`intensity` 范围为 1–5。

| 方法 | 路径 | 说明 | 成功响应 |
| --- | --- | --- | --- |
| `GET` | `/api/health` | 检查 Worker 与 D1 | `200` |
| `POST` | `/api/analyze` | 根据日记生成 AI 情绪分析 | `200` |
| `GET` | `/api/entries` | 获取最近 50 条日记 | `200` |
| `POST` | `/api/entries` | 新建日记 | `201` |
| `GET` | `/api/entries/:id` | 获取单条日记 | `200` |
| `PUT` | `/api/entries/:id` | 完整更新单条日记 | `200` |
| `DELETE` | `/api/entries/:id` | 删除单条日记 | `204` |

无效输入返回 `400`，记录不存在返回 `404`，不支持的方法返回 `405`。

## 免费额度

Cloudflare Workers 和 D1 的计划、免费额度与计费规则可能变化，请以官方页面为准：

- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

## 常见故障

- **端口权限或端口被占用**：若 `npm run dev` 无法监听默认端口，检查本机权限和端口占用，或运行 `npm run dev -- --port 8788` 更换端口。
- **数据库表不存在**：本地先运行 `npm run db:migrate:local`；线上先确认 `database_id`，再运行 `npm run db:migrate:remote`。
- **未登录 Cloudflare**：运行 `npx wrangler login`，然后用 `npx wrangler whoami` 确认登录状态和账号。
