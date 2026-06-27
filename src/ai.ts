import type { AnalysisInput, AnalysisResult, Env, Mood } from "./types";

const moods = new Set<Mood>([
  "happy",
  "calm",
  "anxious",
  "sad",
  "tired",
  "angry",
]);

const planetIndexes: Record<Mood, number> = {
  calm: 0,
  happy: 1,
  anxious: 2,
  sad: 3,
  tired: 4,
  angry: 5,
};

const moodLabels: Record<Mood, string> = {
  happy: "开心",
  calm: "平静",
  anxious: "焦虑",
  sad: "难过",
  tired: "疲惫",
  angry: "生气",
};

const maxFieldLength = 180;

export class InvalidAnalysisInputError extends Error {
  constructor() {
    super("Invalid analysis request");
  }
}

export class AiServiceNotConfiguredError extends Error {
  constructor() {
    super("AI service not configured");
  }
}

export class AiServiceError extends Error {
  constructor(message = "AI service failed") {
    super(message);
  }
}

export function validateAnalysisInput(value: unknown): AnalysisInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidAnalysisInputError();
  }

  const input = value as Record<string, unknown>;
  const content =
    typeof input.content === "string" ? input.content.trim() : null;
  const mood = input.mood;

  if (
    content === null ||
    content.length < 2 ||
    content.length > 400 ||
    typeof mood !== "string" ||
    !moods.has(mood as Mood)
  ) {
    throw new InvalidAnalysisInputError();
  }

  return { content, mood: mood as Mood };
}

function asShortText(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maxFieldLength);
}

function normalizeAnalysis(value: unknown, fallbackMood: Mood): AnalysisResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AiServiceError("AI response was not an object");
  }

  const record = value as Record<string, unknown>;
  const mood =
    typeof record.mood === "string" && moods.has(record.mood as Mood)
      ? (record.mood as Mood)
      : fallbackMood;

  return {
    mood,
    companion: asShortText(
      record.companion,
      `我读到了你今天更接近${moodLabels[mood]}的心情。`,
    ),
    summary: asShortText(record.summary, "你今天的情绪正在被认真看见。"),
    reason: asShortText(record.reason, "这种感受可能来自今天具体经历和身体状态的共同作用。"),
    advice: asShortText(record.advice, "先允许自己慢一点，再决定下一步要怎么走。"),
    keywords: asShortText(record.keywords, `${moodLabels[mood]}、整理、照顾自己`),
    quote: asShortText(record.quote, "行到水穷处，坐看云起时。"),
    source: asShortText(record.source, "王维《终南别业》"),
    metaphorTitle: asShortText(record.metaphorTitle, "今日意象：一颗慢慢发光的小星球"),
    metaphorText: asShortText(record.metaphorText, "它不急着照亮全部宇宙，只先温柔地照见你。"),
    planetIndex: planetIndexes[mood],
  };
}

function buildPrompt(input: AnalysisInput): string {
  return [
    "你是一个温柔、克制、不诊断疾病的中文 AI 情绪日记陪伴者。",
    "请根据用户日记生成一张“今日共鸣星球”卡片。",
    "要求：只输出 JSON，不要 Markdown，不要解释；语言自然，有文学感，但不要过度鸡汤；不要编造具体事实；引用优先使用真实诗句、文学句子或电影台词，无法确定来源时用广义出处。",
    "JSON 字段必须为：mood, companion, summary, reason, advice, keywords, quote, source, metaphorTitle, metaphorText。",
    "mood 只能是 happy、calm、anxious、sad、tired、angry 之一，可以参考用户预选心情，但允许根据正文调整。",
    "每个中文字段控制在 80 字以内，keywords 用顿号分隔。",
    `用户预选心情：${input.mood}`,
    `日记正文：${input.content}`,
  ].join("\n");
}

export async function analyzeDiary(
  env: Env,
  input: AnalysisInput,
): Promise<AnalysisResult> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new AiServiceNotConfiguredError();
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content:
            "你只返回严格 JSON。你不是心理医生，不做诊断，只做日记陪伴和情绪文字整理。",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 650,
    }),
  });

  if (!response.ok) {
    throw new AiServiceError(`DeepSeek HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiServiceError("DeepSeek response did not include content");
  }

  try {
    return normalizeAnalysis(JSON.parse(content), input.mood);
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }
    throw new AiServiceError("DeepSeek returned invalid JSON");
  }
}
