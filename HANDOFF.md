# Project Handoff

Updated: 2026-06-27

## 当前状态

新版「情绪星球」UI 已**上线**为正式应用，带云端持久化。

- 线上地址：https://ai-emotion-diary.freya-lab.workers.dev
- 部署版本提交：`main` 分支，commit `7fc1709`
- 部署命令：`npm run deploy`（wrangler deploy，已验证成功）

## 架构（同域）

```
浏览器
  ├─ 静态前端 public/  （Worker 的 ASSETS 绑定提供）
  └─ /api/* → Cloudflare Worker (src/) → D1 (emotion-diary-db)
```

- 鉴权：所有 `/api/entries*` 需要 `Authorization: Bearer <DIARY_ACCESS_TOKEN>`。
- `DIARY_ACCESS_TOKEN` 是 Cloudflare 密钥（生产用 `wrangler secret put` 设置；本地在 `.dev.vars`，两者可不同）。
- Entry 数据模型：`{ id, content, mood, intensity(1-5), aiResponse, createdAt, updatedAt }`，mood ∈ happy/calm/anxious/sad/tired/angry。

## ⚠️ 关键：改哪个文件

本项目有**两个**情绪星球 HTML，别改错：

| 文件 | 作用 | 持久化 |
|---|---|---|
| **`public/index.html`** | **线上部署的正式应用**。改这里才会影响线上。 | 云端（Worker API + D1）+ 访问口令面板 |
| `.worktrees/emotion-planet-prototype/ai-emotion-diary-prototype.html` | 独立 UI 原型（在 `feat/emotion-planet-prototype` 分支迭代用） | 仅 localStorage，无口令 |

两者 UI/CSS 几乎相同；`public/index.html` 在此基础上**额外**接了后端：
- 访问口令面板（`#accessTokenPanel`，token 存 `sessionStorage["diaryAccessToken"]`）。
- `loadHistory()` GET `/api/entries`；`saveLatestEntry()` POST `{content, mood, intensity:3, aiResponse}`；都处理 401（清 token）。
- `mapApiEntry()` 把 API 行（content/mood/createdAt）映射成原型 entry，再走 `migrateHistory()` 补全 mood 派生字段。
- 渲染一律用 `textContent`（无 innerHTML，防 XSS）。

**改线上 UI**：直接改 `public/index.html`。如果在 worktree 原型里改了想同步到线上，需要把改动手工搬进 `public/index.html` 并保留上面的后端接线（不能整文件覆盖，否则会丢掉口令/API 逻辑）。

## 场景与素材

- 两个全屏场景：情绪花园（近期 7 条，木花架摆花）、星象台（全部历史，漂浮星球 + 循环星空 `<video>`）。
- 素材在 `public/assets/emotion-planet/`（部署只发 `public/`）。星空视频 `starmap-bg.mp4`(6.8MB)/`.webm`(6.6MB)，海报 `starmap-bg.png` 兜底。
- 视频需服务器支持 HTTP Range；Cloudflare 支持，本地 `python -m http.server` 不支持（会只显示海报）。

## 验证命令

```bash
npm test          # legacy 契约(prototype/overview/public/schema) + vitest API(35)
npm run dev       # wrangler dev：本地完整环境(Worker+D1+assets)，默认 8787
npm run deploy    # 部署到 Cloudflare
```

本次上线已端到端验证：输入口令 → 保存 → 从 D1 读历史渲染，全部正常。

## 下一步建议

1. 移动端走查两个新场景（木花架、漂浮星球）的布局。
2. 把 worktree 原型与 `public/index.html` 的关系收敛：长期最好只维护 `public/index.html` 一份，避免双份漂移。
3. 若需要，给星象台换更高分辨率的星空视频源（当前 720×1280，桌面全屏会偏软）。
4. 资源体积：星空视频 ~6.8MB，后续可考虑进一步压缩或按视口加载。

## 不在当前范围

- 真实 AI 分析（当前分析文案由 mood 静态映射，存在 `moodProfiles`）。
- 多用户/登录（目前是单口令访问）。
</content>
