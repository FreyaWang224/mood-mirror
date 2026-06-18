import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./ai-emotion-diary-prototype.html", import.meta.url), "utf8");

const requiredText = [
  "AI 情绪日记",
  "Module 1: App Header",
  "Module 2: Mood Selector",
  "Module 3: Diary Input",
  "Module 4: AI Emotion Analysis",
  "Module 5: Resonance Card",
  "Module 6: Diary History",
  "Module 7: Prototype Comments",
  "assets/mood-visual-sheet.png",
  "step-input",
  "step-result",
  "resultPanel",
  "is-result-ready",
  "行到水穷处，坐看云起时",
  "山重水复疑无路，柳暗花明又一村",
  "capybara",
  "generateBtn",
  "saveBtn",
  "localStorage"
];

for (const text of requiredText) {
  assert.ok(html.includes(text), `Expected prototype to include: ${text}`);
}

const moodKeys = ["happy", "calm", "anxious", "sad", "tired", "angry"];
for (const mood of moodKeys) {
  assert.match(html, new RegExp(`data-mood="${mood}"`), `Missing mood option: ${mood}`);
}

assert.ok(!html.includes("TODO"), "Prototype should not contain TODO placeholders.");
assert.ok(!html.includes("TBD"), "Prototype should not contain TBD placeholders.");
assert.ok(!html.includes("<b>Visual Asset</b>"), "Visual asset implementation notes should not appear inside the result card.");
assert.ok(!html.includes("<b>Prototype Use</b>"), "Prototype use implementation notes should not appear inside the result card.");
assert.ok(!html.includes("<b>Next Step</b>"), "Next-step implementation notes should not appear inside the result card.");

console.log("Prototype structure checks passed.");
