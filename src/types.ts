export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DEEPSEEK_API_KEY?: string;
}

export type OwnerId = string;

export type Mood =
  | "happy"
  | "calm"
  | "anxious"
  | "sad"
  | "tired"
  | "angry";

export interface Entry {
  id: string;
  ownerId: OwnerId;
  content: string;
  mood: Mood;
  intensity: number;
  aiResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntryInput {
  content: string;
  mood: Mood;
  intensity: number;
  aiResponse?: string | null;
}

export interface AnalysisInput {
  content: string;
  mood: Mood;
}

export interface AnalysisResult {
  mood: Mood;
  title: string;
  companion: string;
  letter: string;
  summary: string;
  emotionInsight: string;
  reason: string;
  innerReminder: string;
  advice: string;
  smallAction: string;
  keywords: string;
  quote: string;
  source: string;
  quoteReason: string;
  metaphorTitle: string;
  metaphorText: string;
  imageMood: Mood;
  planetIndex: number;
}
