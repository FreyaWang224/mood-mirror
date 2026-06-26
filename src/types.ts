export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DIARY_ACCESS_TOKEN?: string;
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
