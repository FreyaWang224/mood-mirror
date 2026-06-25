import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");

for (const text of [
  "AI 情绪日记",
  "Module 1: App Header",
  "Module 2: Mood Selector",
  "Module 3: Diary Input",
  "Module 4: AI Emotion Analysis",
  "Module 5: Resonance Card",
  "Module 6: Diary History",
  "Module 7: Prototype Comments",
  "行到水穷处，坐看云起时",
  "山重水复疑无路，柳暗花明又一村",
  "capybara",
]) {
  assert.ok(html.includes(text), `Expected deployed page to retain: ${text}`);
}

assert.ok(
  existsSync(new URL("./public/assets/mood-visual-sheet.png", import.meta.url)),
  "Expected the mood visual asset to be copied into public/assets.",
);
assert.ok(
  html.includes('url("assets/mood-visual-sheet.png")'),
  "Expected the deployed page to use its public asset path.",
);

assert.match(html, /async function loadHistory\s*\(/);
assert.match(html, /async function saveEntry\s*\(/);
assert.match(html, /async function refreshHistory\s*\(/);
assert.match(html, /fetch\(["']\/api\/entries["']/);
assert.match(html, /response\.ok/);
assert.ok(
  html.includes("保存失败，请稍后重试。"),
  "Expected a visible Chinese save failure message.",
);
assert.ok(
  html.includes("历史读取失败，请稍后重试。"),
  "Expected a visible Chinese history loading failure message.",
);

assert.ok(
  !html.includes("localStorage.setItem"),
  "Deployed page must not save entries to localStorage.",
);
assert.ok(
  !html.includes("localStorage.removeItem"),
  "Deployed page must not clear entries from localStorage.",
);
assert.ok(
  !/clearBtn\.addEventListener[\s\S]*?DELETE/.test(html),
  "Refresh history must not issue a bulk DELETE.",
);
assert.match(html, /clearBtn\.textContent\s*=\s*["']刷新历史["']/);

assert.match(
  html,
  /content:\s*entry\.diary[\s\S]*?mood:\s*entry\.mood[\s\S]*?intensity:\s*3[\s\S]*?aiResponse:\s*entry\.note/,
);
assert.match(
  html,
  /fetch\(["']\/api\/entries["'],\s*\{[\s\S]*?method:\s*["']POST["']/,
);
assert.match(
  html,
  /saveBtn\.addEventListener\(["']click["'],\s*async\s*\(\)\s*=>[\s\S]*?await saveEntry\(latestEntry\)[\s\S]*?await refreshHistory\(\)/,
);
assert.match(
  html,
  /function applyProfile\s*\([\s\S]*?saveBtn\.textContent\s*=\s*["']保存日记["'][\s\S]*?saveStatus\.textContent\s*=\s*["']["']/,
);
assert.match(
  html,
  /clearBtn\.addEventListener\(["']click["'],\s*refreshHistory\)/,
);
assert.match(html, /refreshHistory\(\);\s*<\/script>/);

assert.match(html, /item\.content/);
assert.match(html, /item\.mood/);
assert.match(html, /item\.createdAt/);
assert.match(html, /\.textContent\s*=\s*item\.content/);
assert.ok(
  !/innerHTML\s*=\s*items\.map/.test(html),
  "History entries must not interpolate user-controlled fields into innerHTML.",
);
assert.ok(
  !/(?:innerHTML|insertAdjacentHTML)\s*[\s\S]*\$\{item\.(?:content|mood|createdAt|aiResponse)\}/.test(
    html,
  ),
  "User-controlled API fields must not be inserted into HTML.",
);

console.log("Public frontend API integration checks passed.");
