import { env, SELF } from "cloudflare:test";
import { afterEach, expect, vi } from "vitest";
import type { Env } from "../src/types";

const api = (path: string, init?: RequestInit) =>
  SELF.fetch(`https://example.com${path}`, init);

const ownerHeaders = { "x-diary-owner": "friend-a" };

function withOwner(init: RequestInit = {}, ownerId = "friend-a"): RequestInit {
  return {
    ...init,
    headers: {
      "x-diary-owner": ownerId,
      ...(init.headers ?? {}),
    },
  };
}

const validInput = {
  content: "  今天的风很舒服。  ",
  mood: "calm",
  intensity: 3,
  aiResponse: "允许自己慢一点。",
};

async function createEntry(
  input: Record<string, unknown> = validInput,
): Promise<Record<string, unknown>> {
  const response = await api("/api/entries", {
    method: "POST",
    headers: { ...ownerHeaders, "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  expect(response.status).toBe(201);
  return response.json();
}

beforeEach(async () => {
  await env.DB
    .prepare(
      `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL DEFAULT 'freya' CHECK (length(owner_id) BETWEEN 2 AND 40),
      content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 400),
      mood TEXT NOT NULL CHECK (
        mood IN ('happy', 'calm', 'anxious', 'sad', 'tired', 'angry')
      ),
      intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
      ai_response TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    )
    .run();
  await env.DB
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries (created_at DESC)",
    )
    .run();
  await env.DB
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_entries_owner_created_at ON entries (owner_id, created_at DESC)",
    )
    .run();
  await env.DB.prepare("DELETE FROM entries").run();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("diary entries API", () => {
  it("reports a healthy D1 binding", async () => {
    const response = await api("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("requires an invite identity for diary entries", async () => {
    const response = await api("/api/entries");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid owner" });
  });

  it("rejects an invalid invite identity for diary entries", async () => {
    const response = await api("/api/entries", {
      headers: { "x-diary-owner": "x" },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid owner" });
  });

  it("requires an invite identity for AI analysis", async () => {
    const response = await api("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "今天有点累", mood: "tired" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid owner" });
  });

  it("validates AI analysis input", async () => {
    const response = await api("/api/analyze", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify({ content: " ", mood: "sparkly" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid analysis request" });
  });

  it("returns a normalized DeepSeek analysis", async () => {
    const deepSeekFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: "calm",
                title: "你在给自己留出一口气。",
                companion: "我读到了你给自己的呼吸。",
                letter: "我读到你今天终于松了一口气。\n这不是退后，而是身体在帮你回到自己这里。\n今晚可以允许世界先安静一会儿。",
                summary: "你今天整体更接近平静。",
                emotionInsight: "你今天主要的情绪是平静，像是终于从紧绷里退出来一点。",
                reason: "你在把事情慢慢放回合适的位置。",
                innerReminder: "它可能在提醒你，不必一直用力证明自己。",
                advice: "今晚可以少安排一点。",
                smallAction: "睡前把明天最重要的一件小事写下来，然后早点关灯。",
                keywords: "平静、整理、呼吸",
                quote: "行到水穷处，坐看云起时。",
                source: "王维《终南别业》",
                quoteReason: "这句适合今天的你，因为它允许人停在暂时没有答案的地方。",
                metaphorTitle: "今日意象：月光下的小湖",
                metaphorText: "水面并非没有波纹，只是终于能够照见月亮。",
                imageMood: "calm",
              }),
            },
          },
        ],
      }),
    } as Response);

    const response = await api("/api/analyze", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify({ content: "今天累到只想好好休息", mood: "tired" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mood: "calm",
      title: "你在给自己留出一口气。",
      companion: "我读到了你给自己的呼吸。",
      letter: "我读到你今天终于松了一口气。\n这不是退后，而是身体在帮你回到自己这里。\n今晚可以允许世界先安静一会儿。",
      summary: "你今天整体更接近平静。",
      emotionInsight: "你今天主要的情绪是平静，像是终于从紧绷里退出来一点。",
      reason: "你在把事情慢慢放回合适的位置。",
      innerReminder: "它可能在提醒你，不必一直用力证明自己。",
      advice: "今晚可以少安排一点。",
      smallAction: "睡前把明天最重要的一件小事写下来，然后早点关灯。",
      keywords: "平静、整理、呼吸",
      quote: "行到水穷处，坐看云起时。",
      source: "王维《终南别业》",
      quoteReason: "这句适合今天的你，因为它允许人停在暂时没有答案的地方。",
      metaphorTitle: "今日意象：月光下的小湖",
      metaphorText: "水面并非没有波纹，只是终于能够照见月亮。",
      imageMood: "calm",
      planetIndex: 0,
    });
    expect(deepSeekFetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-deepseek-key",
          "content-type": "application/json",
        }),
      }),
    );
    const requestBody = JSON.parse(
      (deepSeekFetch.mock.calls[0][1] as RequestInit).body as string,
    ) as { messages: Array<{ role: string; content: string }> };
    const userPrompt = requestBody.messages.find(
      (message) => message.role === "user",
    )?.content;
    expect(userPrompt).toContain("候选摘句");
    expect(userPrompt).toContain("只能从候选摘句中选择一句");
    expect(userPrompt).toContain("人时已尽，人世还长，我在中间，应该休息。");
    expect(userPrompt).toContain("顾城");
  });

  it("retries transient DeepSeek failures before returning analysis", async () => {
    const deepSeekFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: "overloaded" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  mood: "anxious",
                  title: "慢一点，也是在练习。",
                  companion: "我读到了你的着急。",
                  letter: "今天的你有点紧绷。\n这份紧绷来自你对表达的认真。\n先允许自己慢一点。",
                  summary: "你今天整体更接近焦虑。",
                  emotionInsight: "你今天主要的情绪是焦虑。",
                  reason: "你对即时表达有很高期待。",
                  innerReminder: "它可能在提醒你，熟练需要被允许慢慢长出来。",
                  advice: "先把练习目标收小。",
                  smallAction: "今晚只录一段 30 秒即兴表达。",
                  keywords: "焦虑、练习、表达",
                  quote: "有些事不是看到了希望才去坚持，而是因为坚持才会看到希望。",
                  source: "《十宗罪》",
                  quoteReason: "这句贴合你现在还在练习中的状态。",
                  metaphorTitle: "今日意象：慢慢松开的毛线",
                  metaphorText: "线头已经被你找到了。",
                  imageMood: "anxious",
                }),
              },
            },
          ],
        }),
      } as Response);

    const response = await api("/api/analyze", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify({ content: "托福口语好难练", mood: "anxious" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mood: "anxious",
      title: "慢一点，也是在练习。",
    });
    expect(deepSeekFetch).toHaveBeenCalledTimes(2);
    const requestBody = JSON.parse(
      (deepSeekFetch.mock.calls[1][1] as RequestInit).body as string,
    ) as { max_tokens: number };
    expect(requestBody.max_tokens).toBeGreaterThanOrEqual(1000);
  });

  it("creates a valid entry with a UUID and camelCase fields", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify(validInput),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const entry = await response.json<Record<string, unknown>>();
    expect(entry).toMatchObject({
      content: "今天的风很舒服。",
      mood: "calm",
      intensity: 3,
      aiResponse: "允许自己慢一点。",
    });
    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(new Date(entry.createdAt as string).toISOString()).toBe(
      entry.createdAt,
    );
    expect(entry.updatedAt).toBe(entry.createdAt);
  });

  it("lists only the 50 newest entries in descending creation order", async () => {
    const insert = env.DB.prepare(
      `INSERT INTO entries
        (id, owner_id, content, mood, intensity, ai_response, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const entries = Array.from({ length: 51 }, (_, index) => {
      const id = `entry-${index.toString().padStart(2, "0")}`;
      const createdAt = new Date(
        Date.UTC(2026, 0, 1, 0, index),
      ).toISOString();
      return insert.bind(
        id,
        "friend-a",
        `日记 ${index}`,
        "calm",
        3,
        null,
        createdAt,
        createdAt,
      );
    });
    await env.DB.batch(entries);

    const response = await api("/api/entries", withOwner());

    expect(response.status).toBe(200);
    const body = await response.json<Array<Record<string, unknown>>>();
    expect(body).toHaveLength(50);
    expect(body.map((entry) => entry.id)).toEqual(
      Array.from(
        { length: 50 },
        (_, index) => `entry-${(50 - index).toString().padStart(2, "0")}`,
      ),
    );
  });

  it("isolates entries by invite identity", async () => {
    const createFor = async (ownerId: string, content: string) => {
      const response = await api("/api/entries", withOwner({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validInput, content }),
      }, ownerId));
      expect(response.status).toBe(201);
      return response.json<Record<string, unknown>>();
    };

    const friendA = await createFor("friend-a", "朋友 A 的日记");
    const friendB = await createFor("friend-b", "朋友 B 的日记");

    const response = await api("/api/entries", withOwner({}, "friend-a"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([friendA]);

    const hidden = await api(`/api/entries/${friendB.id}`, withOwner({}, "friend-a"));
    expect(hidden.status).toBe(404);
  });

  it.each([
    [
      "minimum intensity with maximum content and AI response",
      {
        content: "x".repeat(400),
        mood: "calm",
        intensity: 1,
        aiResponse: "y".repeat(2000),
      },
    ],
    [
      "maximum intensity",
      {
        content: "边界",
        mood: "happy",
        intensity: 5,
        aiResponse: null,
      },
    ],
  ])("accepts valid boundaries: %s", async (_name, body) => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject(body);
  });

  it("gets a single entry", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`, withOwner());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(entry);
  });

  it("updates an entry while preserving createdAt", async () => {
    const entry = await createEntry();

    const response = await api(`/api/entries/${entry.id}`, {
      method: "PUT",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        content: "  修改后的正文  ",
        mood: "happy",
        intensity: 5,
        aiResponse: null,
      }),
    });

    expect(response.status).toBe(200);
    const updated = await response.json<Record<string, unknown>>();
    expect(updated).toMatchObject({
      id: entry.id,
      content: "修改后的正文",
      mood: "happy",
      intensity: 5,
      aiResponse: null,
      createdAt: entry.createdAt,
    });
    expect(Date.parse(updated.updatedAt as string)).toBeGreaterThanOrEqual(
      Date.parse(entry.updatedAt as string),
    );
  });

  it("deletes an entry and then returns 404", async () => {
    const entry = await createEntry();

    const removed = await api(`/api/entries/${entry.id}`, {
      method: "DELETE",
      headers: ownerHeaders,
    });
    expect(removed.status).toBe(204);
    expect(await removed.text()).toBe("");

    const missing = await api(`/api/entries/${entry.id}`, withOwner());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["blank content", { ...validInput, content: "   " }],
    ["content over 400 characters", { ...validInput, content: "x".repeat(401) }],
    ["missing content", { mood: "calm", intensity: 3 }],
    ["non-string content", { ...validInput, content: 123 }],
    ["unknown mood", { ...validInput, mood: "excited" }],
    ["missing mood", { content: "正文", intensity: 3 }],
    ["non-string mood", { ...validInput, mood: 123 }],
    ["non-integer intensity", { ...validInput, intensity: 2.5 }],
    ["intensity below range", { ...validInput, intensity: 0 }],
    ["intensity above range", { ...validInput, intensity: 6 }],
    ["missing intensity", { content: "正文", mood: "calm" }],
    ["non-number intensity", { ...validInput, intensity: "3" }],
    [
      "aiResponse over 2000 characters",
      { ...validInput, aiResponse: "x".repeat(2001) },
    ],
    ["non-string aiResponse", { ...validInput, aiResponse: 123 }],
    ["non-object body", []],
  ])(
    "rejects invalid input: %s",
    async (
      _name: string,
      body: Record<string, unknown> | readonly unknown[],
    ) => {
      const response = await api("/api/entries", {
        method: "POST",
        headers: { ...ownerHeaders, "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid entry" });
    },
  );

  it("returns 400 rather than 500 for malformed JSON", async () => {
    const response = await api("/api/entries", {
      method: "POST",
      headers: { ...ownerHeaders, "content-type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid entry" });
  });

  it("returns 404 for missing entries", async () => {
    const response = await api("/api/entries/missing", withOwner());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it.each([
    ["PUT", "/api/entries"],
    ["DELETE", "/api/entries"],
    ["POST", "/api/entries/some-id"],
    ["PATCH", "/api/entries/some-id"],
    ["POST", "/api/health"],
  ])(
    "returns 405 for unsupported %s %s",
    async (method: string, path: string) => {
      const response = await api(
        path,
        path.startsWith("/api/entries") ? withOwner({ method }) : { method },
      );

      expect(response.status).toBe(405);
      expect(await response.json()).toEqual({ error: "Method not allowed" });
    },
  );

  it("returns 404 for an unknown API route", async () => {
    const response = await api("/api/unknown");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it("returns the JSON 404 response for the API root", async () => {
    const response = await api("/api");

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it("serves non-API requests through the ASSETS binding", async () => {
    const request = new Request("https://example.com/");
    const [response, assetResponse] = await Promise.all([
      SELF.fetch(request.clone()),
      (env as Env).ASSETS.fetch(request),
    ]);

    expect(response.status).toBe(assetResponse.status);
    expect(response.headers.get("content-type")).toBe(
      assetResponse.headers.get("content-type"),
    );
    expect(await response.text()).toBe(await assetResponse.text());
  });
});
