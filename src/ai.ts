import type { AnalysisInput, AnalysisResult, Env, Mood } from "./types";
import { selectQuoteCandidates } from "./quotes";

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
const maxLetterLength = 420;
const maxQuoteLength = 360;

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

function asText(value: unknown, fallback: string, maxLength: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maxLength);
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
  const imageMood =
    typeof record.imageMood === "string" && moods.has(record.imageMood as Mood)
      ? (record.imageMood as Mood)
      : mood;

  return {
    mood,
    title: asShortText(record.title, `今天的你更接近${moodLabels[mood]}。`),
    companion: asShortText(
      record.companion,
      `我读到了你今天更接近${moodLabels[mood]}的心情。`,
    ),
    letter: asText(
      record.letter,
      `我读到你今天更接近${moodLabels[mood]}。\n不必急着把一切说明白，先把这份感受好好放下。\n今晚可以给自己一点安静的位置。`,
      maxLetterLength,
    ),
    summary: asShortText(record.summary, "你今天的情绪正在被认真看见。"),
    emotionInsight: asShortText(
      record.emotionInsight,
      typeof record.summary === "string" ? record.summary : "你今天的情绪正在被认真看见。",
    ),
    reason: asShortText(record.reason, "这种感受可能来自今天具体经历和身体状态的共同作用。"),
    innerReminder: asShortText(
      record.innerReminder,
      typeof record.reason === "string" ? record.reason : "它可能在提醒你，需要重新把注意力放回自己身上。",
    ),
    advice: asShortText(record.advice, "先允许自己慢一点，再决定下一步要怎么走。"),
    smallAction: asShortText(
      record.smallAction,
      typeof record.advice === "string" ? record.advice : "今晚做一件很小的照顾自己的事。",
    ),
    keywords: asShortText(record.keywords, `${moodLabels[mood]}、整理、照顾自己`),
    quote: asText(record.quote, "行到水穷处，坐看云起时。", maxQuoteLength),
    source: asShortText(record.source, "王维《终南别业》"),
    quoteReason: asShortText(
      record.quoteReason,
      "这句适合今天的你，因为它允许人在暂时没有答案的地方停一停。",
    ),
    metaphorTitle: asShortText(record.metaphorTitle, "今日意象：一颗慢慢发光的小星球"),
    metaphorText: asShortText(record.metaphorText, "它不急着照亮全部宇宙，只先温柔地照见你。"),
    imageMood,
    planetIndex: planetIndexes[mood],
  };
}

function buildPrompt(input: AnalysisInput): string {
  const quoteCandidates = selectQuoteCandidates(input.mood)
    .map((quote, index) => (
      `${index + 1}. “${quote.text}” — ${quote.source}（标签：${quote.tags.join("、")}）`
    ))
    .join("\n");

  return [
    "你是一个温柔、克制、不诊断疾病的中文 AI 情绪日记陪伴者。",
    "请根据用户日记生成一张“今日共鸣星球”卡片，整体像一封写给用户的情绪回信。",
    "要求：只输出 JSON，不要 Markdown，不要解释；语言自然，有文学感，但不要过度鸡汤；不要编造具体事实。",
    "JSON 字段必须为：mood, title, companion, letter, summary, emotionInsight, reason, innerReminder, advice, smallAction, keywords, quote, source, quoteReason, metaphorTitle, metaphorText, imageMood。",
    "mood 只能是 happy、calm、anxious、sad、tired、angry 之一，可以参考用户预选心情，但允许根据正文调整。",
    "title 是一句概括今日情绪的话，适合作为卡片大标题。",
    "letter 是今日回信，3-5 句，每句独立成行，用 \\n 分隔，像温柔回应，不要说教。",
    "emotionInsight 写“你今天主要的情绪是什么”；innerReminder 写“它可能在提醒你什么”；smallAction 写今晚一个很小、可执行的行动。",
    "quote 和 source 只能从候选摘句中选择一句，必须原文照抄，不允许改写、不允许自造、不允许使用候选之外的引用。",
    "quoteReason 解释为什么这句适合今天。不要说“因为这句很美”，要贴近日记内容。",
    "metaphorTitle 和 metaphorText 写具体画面描述。imageMood 只能是 happy、calm、anxious、sad、tired、angry 之一，用来选择图像。",
    "如果候选摘句都不完美，也要选其中最接近用户情绪的一句，并在 quoteReason 里自然解释它为什么贴近今天。",
    "每个中文字段控制在 80 字以内，keywords 用顿号分隔。",
    "候选摘句：",
    quoteCandidates,
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
