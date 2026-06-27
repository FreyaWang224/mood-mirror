import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
const vitestConfig = readFileSync(
  new URL("./vitest.config.mts", import.meta.url),
  "utf8",
);

// The deployed page is the emotion-planet UI with its mood metaphors retained.
for (const text of [
  "情绪星球",
  "情绪花园",
  "星象台",
  "今日共鸣星球",
  "行到水穷处，坐看云起时",
  "山重水复疑无路，柳暗花明又一村",
  "capybara",
]) {
  assert.ok(html.includes(text), `Expected deployed page to retain: ${text}`);
}

// Scene background assets must be copied into the deployed public/ tree.
for (const asset of [
  "scroll-frame.webp",
  "garden-bg.webp",
  "starmap-bg.webp",
  "starmap-bg.mp4",
]) {
  assert.ok(
    existsSync(new URL(`./public/assets/emotion-planet/${asset}`, import.meta.url)),
    `Expected ${asset} to be copied into public/assets/emotion-planet.`,
  );
  assert.ok(
    html.includes(`assets/emotion-planet/${asset}`),
    `Expected the deployed page to reference public asset: ${asset}`,
  );
}

// Cloud persistence: history and saving go through the Worker API, not the browser.
assert.match(html, /async function loadHistory\s*\(/);
assert.match(html, /async function saveLatestEntry\s*\(/);
assert.match(html, /function getAccessToken\s*\(/);
assert.match(html, /id=["']accessTokenInput["']/);
assert.match(html, /id=["']saveAccessTokenBtn["']/);
assert.match(html, /sessionStorage\.getItem\(accessTokenStorageKey\)/);
assert.match(html, /sessionStorage\.setItem\(accessTokenStorageKey/);
assert.match(html, /sessionStorage\.removeItem\(accessTokenStorageKey\)/);
assert.ok(!html.includes("window.prompt"), "Access token entry must work without browser prompt support.");

assert.match(html, /fetch\(["']\/api\/entries["']/);
assert.match(html, /authorization:\s*`Bearer \$\{getAccessToken\(\)\}`/);
assert.match(html, /response\.ok/);
assert.match(html, /response\.status\s*===\s*401/);

// POST shape must match the Worker entry contract.
assert.match(
  html,
  /fetch\(["']\/api\/entries["'],\s*\{[\s\S]*?method:\s*["']POST["']/,
);
assert.match(
  html,
  /content:\s*latestEntry\.diary[\s\S]*?mood:\s*latestEntry\.mood[\s\S]*?intensity:\s*3/,
);

// On 401 the stored token is cleared and a visible Chinese message is shown.
assert.match(html, /setAccessToken\(""\)/);
assert.ok(
  html.includes("访问口令不正确，请重新输入。"),
  "Expected a visible Chinese access-token failure message.",
);
assert.ok(
  html.includes("暂时无法保存这颗星球，请保留页面后再试一次。"),
  "Expected a visible Chinese save failure message.",
);
assert.ok(
  html.includes("暂时无法读取你的星球，请稍后再试。"),
  "Expected a visible Chinese history loading failure message.",
);

// Entries are never persisted in the browser.
assert.ok(
  !html.includes("localStorage.setItem"),
  "Deployed page must not save entries to localStorage.",
);
assert.ok(
  !html.includes("localStorage.removeItem"),
  "Deployed page must not clear entries from localStorage.",
);

// User-controlled fields must never reach innerHTML (XSS-safe rendering).
assert.ok(
  !/innerHTML|insertAdjacentHTML/.test(html),
  "Deployed page must render dynamic content with textContent, not innerHTML.",
);

// API rows are mapped through known fields only.
assert.match(html, /function mapApiEntry\s*\(/);
assert.match(html, /row\.content/);
assert.match(html, /row\.mood/);
assert.match(html, /row\.createdAt/);

// Home entry hints should be readable on first paint, then hand off to the
// existing breathing animation after a short orientation moment.
assert.match(
  html,
  /data-hints-ready=["']false["']/,
  "Home hints should start in the visible orientation state.",
);
assert.match(
  html,
  /#appRoot\[data-hints-ready="false"\]\s+\.spot-hint\s*\{[\s\S]*?animation:\s*none;[\s\S]*?opacity:\s*1;[\s\S]*?\}/,
  "Initial home hints should all be visible before breathing starts.",
);
assert.match(
  html,
  /window\.setTimeout\(\(\) => \{[\s\S]*appRoot\.dataset\.hintsReady = "true";[\s\S]*\},\s*1000\);/,
  "Home hints should switch to the animated state after one second.",
);
assert.match(
  html,
  /animation:\s*hint-breathe var\(--hint-duration,\s*7\.4s\) ease-in-out var\(--hint-delay,\s*0s\) infinite both;/,
  "Home hints should use fill-mode both so the handoff into animation is gradual.",
);
assert.match(
  html,
  /\.garden-button \.spot-hint\s*\{[\s\S]*?--hint-duration:\s*7\.2s;[\s\S]*?--hint-delay:\s*0s;[\s\S]*?\}/,
  "Garden hint should have its own breathing timing.",
);
assert.match(
  html,
  /\.observatory-button \.spot-hint\s*\{[\s\S]*?--hint-duration:\s*8\.1s;[\s\S]*?--hint-delay:\s*0\.9s;[\s\S]*?\}/,
  "Observatory hint should be offset from the garden hint.",
);
assert.match(
  html,
  /\.diary-hint\s*\{[\s\S]*?--hint-duration:\s*7\.7s;[\s\S]*?--hint-delay:\s*1\.8s;[\s\S]*?\}/,
  "Diary hint should be offset from the other two hints.",
);
assert.match(
  html,
  /@keyframes hint-breathe\s*\{[\s\S]*?0%[\s\S]*?opacity:\s*0\.9;[\s\S]*?35%[\s\S]*?opacity:\s*0\.76;[\s\S]*?68%[\s\S]*?opacity:\s*0\.12;[\s\S]*?100%[\s\S]*?opacity:\s*0\.9;[\s\S]*?\}/,
  "Hint breathing should fade gradually through intermediate keyframes.",
);

assert.match(
  vitestConfig,
  /include:\s*\[\s*["']test\/\*\*\/\*\.test\.ts["']\s*\]/,
  "Vitest Workers must only collect TypeScript API tests.",
);

console.log("Public frontend API integration checks passed.");
