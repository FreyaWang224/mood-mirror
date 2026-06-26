import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
const vitestConfig = readFileSync(
  new URL("./vitest.config.mts", import.meta.url),
  "utf8",
);

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
assert.match(html, /function getAccessToken\s*\(/);
assert.match(html, /id=["']accessTokenInput["']/);
assert.match(html, /id=["']saveAccessTokenBtn["']/);
assert.match(html, /sessionStorage\.getItem\(["']diaryAccessToken["']\)/);
assert.match(html, /sessionStorage\.setItem\(["']diaryAccessToken["']/);
assert.match(html, /sessionStorage\.removeItem\(["']diaryAccessToken["']\)/);
assert.ok(!html.includes("window.prompt"), "Access token entry must work without browser prompt support.");
assert.match(html, /fetch\(["']\/api\/entries["']/);
assert.match(html, /authorization:\s*`\s*Bearer \$\{getAccessToken\(\)\}\s*`/);
assert.match(html, /response\.ok/);
assert.match(html, /response\.status\s*===\s*401/);
assert.ok(
  html.includes("访问口令不正确，请重新输入。"),
  "Expected a visible Chinese access-token failure message.",
);
assert.ok(
  html.includes("保存失败，请稍后重试。"),
  "Expected a visible Chinese save failure message.",
);
assert.ok(
  html.includes("日记已保存，但历史列表刷新失败，请点击刷新历史。"),
  "Expected save success to remain visible when only history refresh fails.",
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
  /saveBtn\.addEventListener\(["']click["'],\s*async\s*\(\)\s*=>[\s\S]*?const entryToSave\s*=\s*latestEntry[\s\S]*?await saveEntry\(entryToSave\)[\s\S]*?await refreshHistory\(\)/,
);
assert.match(
  html,
  /await saveEntry\(entryToSave\);\s*saveSucceeded\s*=\s*true[\s\S]*?const historyRefreshed\s*=\s*await refreshHistory\(\);[\s\S]*?if\s*\(\s*!historyRefreshed/,
  "A successful POST must mark the entry saved before refreshing history so refresh failures cannot allow duplicate saves.",
);
assert.match(
  html,
  /async function refreshHistory\s*\([\s\S]*?return true;[\s\S]*?catch\s*\(error\)[\s\S]*?return false;/,
  "History refresh must report failure to callers without throwing away the saved state.",
);
assert.match(
  html,
  /function applyProfile\s*\([\s\S]*?saveBtn\.textContent\s*=\s*["']保存日记["'][\s\S]*?saveStatus\.textContent\s*=\s*["']["']/,
);
assert.match(html, /let isSaving\s*=\s*false/);
assert.match(
  html,
  /function applyProfile\s*\([\s\S]*?saveBtn\.disabled\s*=\s*isSaving/,
  "Generating another result during a save must not re-enable the save button.",
);
assert.match(
  html,
  /saveBtn\.addEventListener\(["']click["'],\s*async\s*\(\)\s*=>\s*\{\s*if\s*\(\s*!latestEntry\s*\|\|\s*isSaving\s*\)/,
  "The save click handler must reject duplicate clicks while a request is pending.",
);
assert.match(
  html,
  /isSaving\s*=\s*true[\s\S]*?try\s*\{[\s\S]*?await saveEntry\([\s\S]*?finally\s*\{[\s\S]*?isSaving\s*=\s*false[\s\S]*?saveBtn\.disabled\s*=/,
  "Saving state and button availability must be restored in finally.",
);
assert.ok(
  html.includes("日记将保存到云端，可在历史日记中查看。"),
  "History copy must accurately describe cloud persistence.",
);
assert.ok(
  !html.includes("保存在当前浏览器中"),
  "History copy must not claim entries are stored in the browser.",
);
assert.match(
  html,
  /clearBtn\.addEventListener\(["']click["'],\s*refreshHistory\)/,
);
assert.match(html, /refreshHistory\(\);\s*<\/script>/);

assert.match(
  vitestConfig,
  /include:\s*\[\s*["']test\/\*\*\/\*\.test\.ts["']\s*\]/,
  "Vitest Workers must only collect TypeScript API tests.",
);

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
