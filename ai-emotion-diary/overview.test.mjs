import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./project-overview.html", import.meta.url), "utf8");

const requiredText = [
  "AI 情绪日记",
  "Project Overview",
  "想法与定位",
  "用户流程",
  "业务模块拆解",
  "AI 参与点",
  "MVP 范围",
  "Prototype Comments",
  "文件维护方式",
  "ai-emotion-diary-prototype.html",
  "assets/mood-visual-sheet.png"
];

for (const text of requiredText) {
  assert.ok(html.includes(text), `Expected overview to include: ${text}`);
}

const moduleNames = [
  "Module 1: App Header",
  "Module 2: Mood Selector",
  "Module 3: Diary Input",
  "Module 4: AI Emotion Analysis",
  "Module 5: Resonance Card",
  "Module 6: Diary History",
  "Module 7: Prototype Comments"
];

for (const moduleName of moduleNames) {
  assert.ok(html.includes(moduleName), `Expected overview to include: ${moduleName}`);
}

assert.ok(!html.includes("TODO"), "Overview should not contain TODO placeholders.");
assert.ok(!html.includes("TBD"), "Overview should not contain TBD placeholders.");

console.log("Overview structure checks passed.");
