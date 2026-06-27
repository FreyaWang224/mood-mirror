export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DIARY_ACCESS_TOKEN?: string;
  DEEPSEEK_API_KEY?: string;
}

export type Mood =
  | "happy"
  | "calm"
  | "anxious"
  | "sad"
  | "tired"
  | "angry";

export interface Entry {
  id: string;
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
  companion: string;
  summary: string;
  reason: string;
  advice: string;
  keywords: string;
  quote: string;
  source: string;
  metaphorTitle: string;
  metaphorText: string;
  planetIndex: number;
}
