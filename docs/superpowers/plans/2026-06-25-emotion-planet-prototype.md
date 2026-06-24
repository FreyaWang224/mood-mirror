# Emotion Planet Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current card-based AI emotion diary with a responsive, cinematic “home planet + daily resonance planet” prototype that preserves the existing simulated analysis, poetry, and local history behavior.

**Architecture:** Keep `ai-emotion-diary-prototype.html` as the single application entry and implement five scene modules inside it: home, journal dialogue, travel, resonance, and history map. A small explicit state machine controls which scene is active; generated raster assets remain text-free under `assets/emotion-planet/`, while HTML/CSS/JavaScript owns all readable text, controls, responsive layout, animation timing, and persistence.

**Tech Stack:** Semantic HTML5, CSS custom properties/keyframes/media queries, vanilla JavaScript, `localStorage`, Node.js structure tests, AI-generated PNG/WebP visual assets, in-app browser verification.

---

## File Structure

- Modify: `ai-emotion-diary-prototype.html`
  - Application markup, visual styling, state machine, simulated analysis, animation control, persistence, and all five interaction modules.
- Modify: `prototype.test.mjs`
  - Static contract tests for scene structure, state names, required controls, accessibility hooks, storage schema, and reduced-motion behavior.
- Modify: `project-overview.html`
  - Update product overview and module descriptions to match the emotion-planet experience.
- Modify: `overview.test.mjs`
  - Update overview contract assertions to the new module names and experience flow.
- Create: `assets/emotion-planet/home-planet-desktop.png`
  - Text-free cinematic home-planet scene for wide layouts.
- Create: `assets/emotion-planet/home-planet-mobile.png`
  - Text-free vertical home-planet scene with safe areas for bottom-sheet UI.
- Create: `assets/emotion-planet/traveler-sprite.png`
  - Original golden-haired star traveler sprite sheet: idle, listening, running, traveling, and greeting.
- Create: `assets/emotion-planet/travel-nebula.png`
  - Text-free nebula and meteor travel layer.
- Create: `assets/emotion-planet/resonance-planets.png`
  - Six-cell mood planet sheet in this order: calm, happy, anxious, sad, tired, angry.
- Create: `assets/emotion-planet/paper-texture.png`
  - Subtle seamless watercolor paper texture with no text.
- Create: `assets/emotion-planet/garden-atlas.png`
  - Flower and small-history-planet visual atlas for recent entries and the star map.

No framework, build system, back end, account system, or true 3D engine is added in this iteration.

### Task 1: Lock the New Prototype Contract

**Files:**
- Modify: `prototype.test.mjs`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Replace the old module assertions with the new scene contract**

Keep the existing checks for the six moods, public-domain poem content, no `TODO`/`TBD`, and `localStorage`. Replace the old card-layout requirements with:

```js
const requiredText = [
  "Mood Mirror",
  "情绪星球",
  'id="homeScene"',
  'id="journalLayer"',
  'id="travelScene"',
  'id="resonanceScene"',
  'id="historyScene"',
  'id="travelerButton"',
  'id="gardenButton"',
  'id="observatoryButton"',
  'data-app-state="home-idle"',
  "home-idle",
  "journal-dialogue",
  "journal-editing",
  "journey-loading",
  "journey-traveling",
  "resonance-intro",
  "resonance-card",
  "history-map",
  "assets/emotion-planet/home-planet-desktop.png",
  "assets/emotion-planet/home-planet-mobile.png",
  "assets/emotion-planet/traveler-sprite.png",
  "行到水穷处，坐看云起时。",
  "山重水复疑无路，柳暗花明又一村。"
];

for (const text of requiredText) {
  assert.ok(html.includes(text), `Expected prototype to include: ${text}`);
}

for (const obsolete of [
  "Module 1: App Header",
  "Module 7: Prototype Comments",
  "Prototype Goal",
  "Prototype Comments"
]) {
  assert.ok(!html.includes(obsolete), `Prototype should remove old presentation content: ${obsolete}`);
}

assert.match(html, /function setAppState\(nextState/);
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
node prototype.test.mjs
```

Expected: FAIL on the first missing scene ID, because the existing prototype still uses the old panel layout.

- [ ] **Step 3: Commit the failing contract**

```bash
git add prototype.test.mjs
git commit -m "test: define emotion planet prototype contract"
```

### Task 2: Generate and Validate the Visual Asset Set

**Files:**
- Create: `assets/emotion-planet/home-planet-desktop.png`
- Create: `assets/emotion-planet/home-planet-mobile.png`
- Create: `assets/emotion-planet/traveler-sprite.png`
- Create: `assets/emotion-planet/travel-nebula.png`
- Create: `assets/emotion-planet/resonance-planets.png`
- Create: `assets/emotion-planet/paper-texture.png`
- Create: `assets/emotion-planet/garden-atlas.png`

- [ ] **Step 1: Create the asset directory**

Run:

```bash
mkdir -p assets/emotion-planet
```

- [ ] **Step 2: Generate the desktop home planet**

Use the `imagegen` skill and built-in image generation tool with this prompt:

```text
Use case: stylized-concept
Asset type: text-free desktop background for an interactive emotion diary
Primary request: A premium cinematic miniature home planet floating in a deep indigo star field. The planet contains a glowing rose garden on the left, a quiet journal nook near the center, and a small glass observatory on the right. An original golden-haired star traveler may appear near the journal nook, but no UI and no words.
Style/medium: intricate stylized 3D, handcrafted animated-film materials, soft volumetric light, emotionally warm and contemplative
Composition/framing: 16:9 landscape, full-bleed, important landmarks separated with clear clickable space, safe negative space in the lower-right for a lightweight interface
Color palette: midnight blue, dusty violet, moss green, parchment ivory, rose red, restrained warm gold
Constraints: original character and world; no direct imitation of an existing game or The Little Prince; no text, logo, watermark, UI cards, or cropped landmark
```

Copy the selected output to:

```text
assets/emotion-planet/home-planet-desktop.png
```

- [ ] **Step 3: Generate the mobile home planet**

Use the same visual language with:

```text
Use case: stylized-concept
Asset type: text-free portrait background for an interactive emotion diary
Primary request: Vertical version of a cinematic miniature home planet in a deep indigo star field. The original golden-haired star traveler and journal nook sit in the upper-middle, with rose garden and observatory both visible. Leave calm dark negative space in the lower third for a bottom-sheet journal interface.
Style/medium: intricate stylized 3D, handcrafted animated-film materials, soft volumetric light
Composition/framing: 9:16 portrait; no important subject behind the lower UI safe area
Constraints: match the desktop scene; no text, logo, watermark, UI, direct IP imitation, or cropped character
```

Copy to `assets/emotion-planet/home-planet-mobile.png`.

- [ ] **Step 4: Generate the traveler sprite sheet**

Use:

```text
Use case: stylized-concept
Asset type: five-frame character sprite sheet for CSS background-position animation
Primary request: One original small golden-haired star traveler shown in five full-body poses arranged in a precise single horizontal row: idle breathing, listening, running, riding a meteor, and greeting. Identical face, clothing, proportions, lighting, and camera angle in every frame.
Subject: moss-green short coat, cream trousers, brown boots, flowing muted-blue scarf; original face and silhouette
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background
Constraints: each frame same dimensions, generous padding, no overlap, no shadows on background, no text, no watermark, no Little Prince costume
```

Copy the source to a temporary project path and remove the chroma key using:

```bash
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input assets/emotion-planet/traveler-sprite-source.png \
  --out assets/emotion-planet/traveler-sprite.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

Verify the final PNG has alpha and transparent corners, then remove only the intermediate `traveler-sprite-source.png`.

- [ ] **Step 5: Generate travel, resonance, paper, and history atlases**

Generate four text-free assets:

```text
travel-nebula.png:
16:9 deep-indigo nebula corridor with a diagonal warm meteor trail, cinematic depth, no character, no text, edges suitable for full-screen cover.

resonance-planets.png:
Six equal square cells in a strict 3 columns x 2 rows atlas. Order: calm moonlit lake planet; happy luminous flower meadow planet; anxious wind-and-thread storm planet; sad quiet paper-boat ocean planet; tired lantern dusk planet; angry contained ember-and-stone planet. Identical camera distance and planet scale. No text.

paper-texture.png:
Subtle seamless ivory watercolor paper texture, even lighting, low contrast, no edges, no objects, no text.

garden-atlas.png:
Twelve equal cells in a strict 6 columns x 2 rows atlas. Top row: six rose/flower variations matching calm, happy, anxious, sad, tired, angry. Bottom row: six tiny glowing history planets for the same moods. Transparent-ready flat #00ff00 background, no text.
```

For `garden-atlas.png`, use the same chroma-key removal helper and validate transparency.

- [ ] **Step 6: Validate asset dimensions and file types**

Run:

```bash
file assets/emotion-planet/*
```

Expected: seven readable PNG images; `traveler-sprite.png` and `garden-atlas.png` report RGBA or otherwise contain an alpha channel.

- [ ] **Step 7: Commit the asset set**

```bash
git add assets/emotion-planet
git commit -m "feat: add emotion planet visual assets"
```

### Task 3: Build the Responsive Home Planet Shell

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Replace the old page markup with five semantic scene layers**

Keep `moodProfiles` and poem copy, but replace the old navigation/header/panels/comments with this structure:

```html
<main class="planet-app" id="appRoot" data-app-state="home-idle">
  <section class="scene home-scene is-active" id="homeScene" aria-label="情绪星球家园">
    <div class="star-field" aria-hidden="true"></div>
    <div class="home-planet" aria-hidden="true"></div>

    <button class="scene-hotspot traveler-button" id="travelerButton" type="button"
      aria-label="和星际旅人说话">
      <span class="traveler-sprite" aria-hidden="true"></span>
    </button>
    <button class="scene-hotspot garden-button" id="gardenButton" type="button">
      <span aria-hidden="true">✦</span><span>玫瑰花园</span>
    </button>
    <button class="scene-hotspot observatory-button" id="observatoryButton" type="button">
      <span aria-hidden="true">⌕</span><span>历史星图</span>
    </button>

    <div class="companion-dialogue" id="homeDialogue" role="status">
      <p class="dialogue-speaker">星际旅人</p>
      <p id="homeDialogueText">你回来啦。今天有什么事情留在心里吗？</p>
    </div>
  </section>

  <section class="interaction-layer journal-layer" id="journalLayer" aria-labelledby="journalTitle">
    <!-- journal form added in Task 4 -->
  </section>

  <section class="scene travel-scene" id="travelScene" aria-label="正在前往今日共鸣星球">
    <!-- travel controls added in Task 5 -->
  </section>

  <section class="scene resonance-scene" id="resonanceScene" aria-label="今日共鸣星球">
    <!-- resonance content added in Task 6 -->
  </section>

  <section class="interaction-layer history-scene" id="historyScene" aria-labelledby="historyTitle">
    <!-- history content added in Task 7 -->
  </section>

  <div class="toast" id="appToast" role="status" aria-live="polite"></div>
</main>
```

- [ ] **Step 2: Replace the old visual system with scene-first CSS**

Set the document title to `<title>Mood Mirror · 情绪星球</title>`, then add the core tokens and scene rules:

```css
:root {
  --night: #071326;
  --night-soft: #172545;
  --violet: #66557f;
  --moss: #66785a;
  --paper: #f6eedc;
  --paper-ink: #273044;
  --rose: #bd4f62;
  --gold: #d6ad59;
  --scene-shadow: 0 24px 70px rgba(2, 8, 22, .42);
}

html, body {
  min-height: 100%;
}

body {
  margin: 0;
  overflow: hidden;
  color: #fff;
  background: var(--night);
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
}

.planet-app,
.scene {
  position: relative;
  width: 100%;
  min-height: 100svh;
  overflow: hidden;
}

.scene {
  position: absolute;
  inset: 0;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity .55s ease, visibility .55s;
}

.scene.is-active {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

.home-scene {
  background: #09172d url("assets/emotion-planet/home-planet-desktop.png") center/cover no-repeat;
}

.traveler-button {
  left: 47%;
  bottom: 18%;
  width: clamp(86px, 9vw, 132px);
  aspect-ratio: 3 / 5;
}

.traveler-sprite {
  display: block;
  width: 100%;
  height: 100%;
  background: url("assets/emotion-planet/traveler-sprite.png") 0 0 / 500% 100% no-repeat;
  filter: drop-shadow(0 14px 20px rgba(4, 8, 20, .35));
}

@media (max-width: 700px) {
  .home-scene {
    background-image: url("assets/emotion-planet/home-planet-mobile.png");
  }

  .traveler-button {
    left: 50%;
    bottom: 37%;
    transform: translateX(-50%);
  }
}
```

Use icon-only controls where the symbol is familiar; add visible labels only for the garden and star map landmarks because they are world locations, not standard toolbar actions.

- [ ] **Step 3: Add a minimal application state renderer**

Add:

```js
const appRoot = document.querySelector("#appRoot");
const stateToScene = {
  "home-idle": "homeScene",
  "journal-dialogue": "homeScene",
  "journal-editing": "homeScene",
  "journey-loading": "homeScene",
  "journey-traveling": "travelScene",
  "resonance-intro": "resonanceScene",
  "resonance-card": "resonanceScene",
  "history-map": "homeScene"
};

let appState = "home-idle";
let toastTimer = null;

function setAppState(nextState) {
  appState = nextState;
  appRoot.dataset.appState = nextState;
  const activeSceneId = stateToScene[nextState];
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.toggle("is-active", scene.id === activeSceneId);
  });
  document.querySelectorAll(".interaction-layer").forEach((layer) => {
    const isJournal = layer.id === "journalLayer" &&
      ["journal-dialogue", "journal-editing", "journey-loading"].includes(nextState);
    const isHistory = layer.id === "historyScene" && nextState === "history-map";
    layer.classList.toggle("is-open", isJournal || isHistory);
  });
}

function showToast(message) {
  const toast = document.querySelector("#appToast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}
```

- [ ] **Step 4: Run the contract test**

Run:

```bash
node prototype.test.mjs
```

Expected: PASS with `Prototype structure checks passed.`

- [ ] **Step 5: Open the prototype and verify home composition**

Open `ai-emotion-diary-prototype.html` in the in-app browser and verify:

- Desktop: traveler, garden, observatory, and dialogue are all visible without overlap.
- Mobile 390x844: no landmark is hidden behind the bottom safe area.
- No horizontal scrolling.

- [ ] **Step 6: Commit the home shell**

```bash
git add ai-emotion-diary-prototype.html
git commit -m "feat: build responsive emotion planet home"
```

### Task 4: Add Companion Dialogue and Journal Input

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Add journal-specific assertions**

Add:

```js
for (const text of [
  "今天有什么事情留在你心里？",
  "带我去看看今天的心情",
  'maxlength="400"',
  'aria-live="polite"',
  "请先写下一点今天的心情",
  "function openJournal(",
  "function validateJournal(",
  "assets/emotion-planet/paper-texture.png"
]) {
  assert.ok(html.includes(text), `Missing journal behavior: ${text}`);
}
```

- [ ] **Step 2: Run the test and verify journal assertions fail**

Run `node prototype.test.mjs`.

Expected: FAIL with `Missing journal behavior`.

- [ ] **Step 3: Implement the dialogue-led journal layer**

Insert inside `#journalLayer`:

```html
<div class="paper-panel journal-panel">
  <button class="icon-button close-layer-button" id="closeJournalButton" type="button"
    aria-label="关闭记录">×</button>
  <p class="paper-kicker">来自主星球的邀请</p>
  <h1 id="journalTitle">今天有什么事情留在你心里？</h1>
  <p class="journal-prompt" id="journalPrompt">
    先选一个最接近的感受，再慢慢写下来。
  </p>

  <form id="journalForm">
    <div class="mood-orbit" id="moodOrbit" role="listbox" aria-label="选择今天的心情">
      <button type="button" class="mood-star is-selected" data-mood="calm">平静</button>
      <button type="button" class="mood-star" data-mood="happy">开心</button>
      <button type="button" class="mood-star" data-mood="anxious">焦虑</button>
      <button type="button" class="mood-star" data-mood="sad">难过</button>
      <button type="button" class="mood-star" data-mood="tired">疲惫</button>
      <button type="button" class="mood-star" data-mood="angry">生气</button>
    </div>
    <label for="diaryText">今天的片段</label>
    <textarea id="diaryText" maxlength="400"
      placeholder="不用写得完整，只要把此刻最想留下的片段告诉我。"></textarea>
    <div class="journal-meta">
      <span id="characterCount">0 / 400</span>
      <span id="journalError" role="status" aria-live="polite"></span>
    </div>
    <button class="journey-button" id="journeyButton" type="submit">
      带我去看看今天的心情
    </button>
  </form>
</div>
```

Use `paper-texture.png` as a low-contrast overlay. The panel is a desktop side sheet and a mobile bottom sheet; it must never exceed `min(720px, calc(100svh - 32px))`.

```css
.paper-panel {
  position: relative;
  color: var(--paper-ink);
  background-color: rgba(246, 238, 220, .96);
  box-shadow: var(--scene-shadow);
}

.paper-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url("assets/emotion-planet/paper-texture.png") center/320px repeat;
  mix-blend-mode: multiply;
  opacity: .16;
}
```

- [ ] **Step 4: Implement journal state and validation**

Add:

```js
const travelerButton = document.querySelector("#travelerButton");
const journalForm = document.querySelector("#journalForm");
const diaryText = document.querySelector("#diaryText");
const journalError = document.querySelector("#journalError");
const characterCount = document.querySelector("#characterCount");
const moodButtons = [...document.querySelectorAll(".mood-star")];
let selectedMood = "calm";

function openJournal() {
  setAppState("journal-dialogue");
  window.setTimeout(() => setAppState("journal-editing"), 320);
}

function validateJournal() {
  if (diaryText.value.trim().length < 2) {
    journalError.textContent = "请先写下一点今天的心情。";
    diaryText.focus();
    return false;
  }
  journalError.textContent = "";
  return true;
}

travelerButton.addEventListener("click", openJournal);
document.querySelector("#closeJournalButton").addEventListener("click", () => {
  journalError.textContent = "";
  setAppState("home-idle");
});

diaryText.addEventListener("input", () => {
  characterCount.textContent = `${diaryText.value.length} / 400`;
  if (journalError.textContent) validateJournal();
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;
    moodButtons.forEach((item) => {
      item.classList.toggle("is-selected", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
  });
});
```

- [ ] **Step 5: Run the test and manually verify validation**

Run:

```bash
node prototype.test.mjs
```

Expected: PASS with `Prototype structure checks passed.`

Browser checks:

1. Click traveler: journal panel opens.
2. Submit blank text: no travel; inline reminder appears.
3. Enter text and change mood: selected state updates.
4. Close and reopen: layout remains stable.

- [ ] **Step 6: Commit journal interaction**

```bash
git add ai-emotion-diary-prototype.html prototype.test.mjs
git commit -m "feat: add companion-led journal entry"
```

### Task 5: Implement the Cinematic Journey

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Add journey contract assertions**

Add:

```js
for (const text of [
  "正在穿过今晚的星云",
  "跳过旅程",
  "function beginJourney(",
  "function finishJourney(",
  "prefersReducedMotion",
  "journeyTimer",
  "traveler-sprite--running",
  "traveler-sprite--traveling",
  "assets/emotion-planet/travel-nebula.png"
]) {
  assert.ok(html.includes(text), `Missing journey behavior: ${text}`);
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run `node prototype.test.mjs`.

Expected: FAIL on `正在穿过今晚的星云`.

- [ ] **Step 3: Add travel scene markup**

```html
<div class="travel-nebula" aria-hidden="true"></div>
<div class="meteor-traveler" aria-hidden="true">
  <span class="traveler-sprite traveler-sprite--traveling"></span>
</div>
<div class="travel-status">
  <p>正在穿过今晚的星云</p>
  <button class="text-button" id="skipJourneyButton" type="button">跳过旅程</button>
</div>
```

- [ ] **Step 4: Add animation CSS and reduced-motion fallback**

```css
.travel-nebula {
  position: absolute;
  inset: -8%;
  background: #071326 url("assets/emotion-planet/travel-nebula.png") center/cover no-repeat;
  animation: nebula-push 2.6s ease-in-out both;
}

.meteor-traveler {
  position: absolute;
  left: 16%;
  bottom: 20%;
  animation: meteor-flight 2.6s cubic-bezier(.4, 0, .2, 1) both;
}

.traveler-sprite--running {
  background-position: 50% 0;
  animation: traveler-run .34s steps(2) infinite;
}

.traveler-sprite--traveling {
  background-position: 75% 0;
}

@keyframes traveler-run {
  from { transform: translateX(0); }
  to { transform: translateX(4px); }
}

@keyframes meteor-flight {
  from { transform: translate3d(-12vw, 18vh, 0) scale(.72) rotate(-8deg); }
  to { transform: translate3d(88vw, -58vh, 0) scale(.34) rotate(-18deg); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 5: Implement cancellable journey timing**

```js
const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const homeTravelerSprite =
  document.querySelector("#travelerButton .traveler-sprite");
let journeyTimer = null;

function buildEntry(mood, diary) {
  const profile = moodProfiles[mood];
  return {
    id: `${Date.now()}-${mood}`,
    createdAt: new Date().toISOString(),
    date: formatDate(new Date()),
    mood,
    moodLabel: profile.label,
    diary
  };
}

function beginJourney(event) {
  event.preventDefault();
  if (["journey-loading", "journey-traveling"].includes(appState)) return;
  if (!validateJournal()) return;
  setAppState("journey-loading");
  homeTravelerSprite.classList.add("traveler-sprite--running");
  latestEntry = buildEntry(selectedMood, diaryText.value.trim());
  window.setTimeout(() => {
    homeTravelerSprite.classList.remove("traveler-sprite--running");
    setAppState("journey-traveling");
    journeyTimer = window.setTimeout(
      finishJourney,
      prefersReducedMotion ? 40 : 2600
    );
  }, prefersReducedMotion ? 0 : 420);
}

function finishJourney() {
  if (journeyTimer) window.clearTimeout(journeyTimer);
  journeyTimer = null;
  homeTravelerSprite.classList.remove("traveler-sprite--running");
  setAppState("resonance-intro");
}

journalForm.addEventListener("submit", beginJourney);
document.querySelector("#skipJourneyButton").addEventListener("click", finishJourney);
```

Task 6 replaces this minimal `buildEntry()` with the complete saved-entry schema after resonance-specific profile fields are added.

- [ ] **Step 6: Verify journey behavior**

Run `node prototype.test.mjs`.

Browser checks:

- Valid journal starts the running/loading state, then travel.
- Skip enters resonance immediately.
- Repeated clicks cannot create multiple timers.
- Reduced-motion emulation uses a near-instant fade.

- [ ] **Step 7: Commit the journey**

```bash
git add ai-emotion-diary-prototype.html prototype.test.mjs
git commit -m "feat: add cinematic resonance journey"
```

### Task 6: Build the Resonance Planet and Reveal Card

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Add resonance assertions**

Add:

```js
for (const text of [
  'id="companionResponse"',
  'id="revealCardButton"',
  'id="resonanceCard"',
  'id="summaryText"',
  'id="reasonText"',
  'id="adviceText"',
  'id="keywordsText"',
  'id="quoteText"',
  'id="quoteSource"',
  'id="metaphorTitle"',
  'id="metaphorText"',
  'id="saveEntryButton"',
  'id="returnHomeButton"',
  "function buildEntry(",
  "function renderEntry(",
  "function revealResonanceCard(",
  "assets/emotion-planet/resonance-planets.png"
]) {
  assert.ok(html.includes(text), `Missing resonance behavior: ${text}`);
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run `node prototype.test.mjs`.

Expected: FAIL on the first missing resonance ID.

- [ ] **Step 3: Add resonance scene markup**

```html
<div class="resonance-world" id="resonanceWorld" data-mood="calm" aria-hidden="true"></div>
<div class="resonance-companion">
  <span class="traveler-sprite traveler-sprite--greeting" aria-hidden="true"></span>
  <div class="companion-dialogue">
    <p class="dialogue-speaker">星际旅人</p>
    <p id="companionResponse">今天的你，好像终于给自己留出了一点呼吸的地方。</p>
    <button class="soft-button" id="revealCardButton" type="button">看看这颗星球想告诉你什么</button>
  </div>
</div>

<article class="paper-panel resonance-card" id="resonanceCard" aria-labelledby="resonanceTitle">
  <p class="paper-kicker">今日共鸣星球</p>
  <h1 id="resonanceTitle">你的情绪，被看见了</h1>
  <div class="analysis-grid">
    <section><h2>情绪总结</h2><p id="summaryText"></p></section>
    <section><h2>可能原因</h2><p id="reasonText"></p></section>
    <section><h2>温柔建议</h2><p id="adviceText"></p></section>
    <section><h2>今日关键词</h2><p id="keywordsText"></p></section>
  </div>
  <blockquote>
    <p id="quoteText"></p>
    <cite id="quoteSource"></cite>
  </blockquote>
  <div class="metaphor-copy">
    <h2 id="metaphorTitle"></h2>
    <p id="metaphorText"></p>
  </div>
  <div class="card-actions">
    <button class="primary-button" id="saveEntryButton" type="button">把这颗星球收藏起来</button>
    <button class="secondary-button" id="returnHomeButton" type="button">返回主星球</button>
  </div>
</article>
```

- [ ] **Step 4: Extend mood profiles with companion response and planet index**

Each mood profile must include:

```js
calm: {
  label: "平静",
  companion: "今天的你，好像终于给自己留出了一点呼吸的地方。",
  planetIndex: 0,
  summary: "...",
  reason: "...",
  advice: "...",
  keywords: "...",
  quote: "...",
  source: "...",
  metaphorTitle: "...",
  metaphorText: "..."
}
```

Use indexes `0` through `5` in this exact order: calm, happy, anxious, sad, tired, angry.

- [ ] **Step 5: Replace the minimal entry builder and implement result rendering**

```js
function buildEntry(mood, diary) {
  const profile = moodProfiles[mood];
  return {
    id: `${Date.now()}-${mood}`,
    createdAt: new Date().toISOString(),
    date: formatDate(new Date()),
    mood,
    moodLabel: profile.label,
    diary,
    companion: profile.companion,
    summary: profile.summary,
    reason: profile.reason,
    advice: profile.advice,
    keywords: profile.keywords,
    quote: profile.quote,
    source: profile.source,
    metaphorTitle: profile.metaphorTitle,
    metaphorText: profile.metaphorText,
    planetIndex: profile.planetIndex
  };
}

function renderEntry(entry) {
  document.querySelector("#companionResponse").textContent = entry.companion;
  document.querySelector("#summaryText").textContent = entry.summary;
  document.querySelector("#reasonText").textContent = entry.reason;
  document.querySelector("#adviceText").textContent = entry.advice;
  document.querySelector("#keywordsText").textContent = entry.keywords;
  document.querySelector("#quoteText").textContent = entry.quote;
  document.querySelector("#quoteSource").textContent = entry.source;
  document.querySelector("#metaphorTitle").textContent = entry.metaphorTitle;
  document.querySelector("#metaphorText").textContent = entry.metaphorText;
  document.querySelector("#resonanceWorld").dataset.mood = entry.mood;
  document.querySelector("#resonanceWorld").style.setProperty(
    "--planet-index",
    entry.planetIndex
  );
}

function revealResonanceCard() {
  setAppState("resonance-card");
}

document.querySelector("#revealCardButton")
  .addEventListener("click", revealResonanceCard);
```

Add the atlas CSS and update Task 5's `finishJourney()` so `renderEntry(latestEntry)` runs immediately before `setAppState("resonance-intro")`:

```css
.resonance-world {
  --planet-x: 0;
  --planet-y: 0;
  position: absolute;
  inset: 0;
  background-image: url("assets/emotion-planet/resonance-planets.png");
  background-size: 300% 200%;
  background-position: calc(var(--planet-x) * 50%) calc(var(--planet-y) * 100%);
  background-repeat: no-repeat;
}

.resonance-world[data-mood="calm"] { --planet-x: 0; --planet-y: 0; }
.resonance-world[data-mood="happy"] { --planet-x: 1; --planet-y: 0; }
.resonance-world[data-mood="anxious"] { --planet-x: 2; --planet-y: 0; }
.resonance-world[data-mood="sad"] { --planet-x: 0; --planet-y: 1; }
.resonance-world[data-mood="tired"] { --planet-x: 1; --planet-y: 1; }
.resonance-world[data-mood="angry"] { --planet-x: 2; --planet-y: 1; }
```

The `--planet-index` custom property remains stored for history metadata; `--planet-x` and `--planet-y` provide deterministic atlas positioning without stretching.

- [ ] **Step 6: Verify resonance progression**

Run `node prototype.test.mjs`.

Browser checks:

- Arrival shows only the companion response first.
- Reveal button opens the complete card.
- All six moods switch planet imagery and copy.
- Long Chinese text remains readable on 390px mobile width.

- [ ] **Step 7: Commit resonance scene**

```bash
git add ai-emotion-diary-prototype.html prototype.test.mjs
git commit -m "feat: add mood-driven resonance planet"
```

### Task 7: Add Garden History, Star Map, and Storage Migration

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Test: `prototype.test.mjs`

- [ ] **Step 1: Add history and schema assertions**

Add:

```js
for (const text of [
  'id="recentGarden"',
  'id="historyMap"',
  'id="historyEmptyState"',
  'id="closeHistoryButton"',
  "function readHistory(",
  "function writeHistory(",
  "function migrateHistory(",
  "function renderGarden(",
  "function renderHistoryMap(",
  "function openHistoryEntry(",
  "createdAt",
  "planetIndex",
  "assets/emotion-planet/garden-atlas.png",
  "mood-mirror-history-v2"
]) {
  assert.ok(html.includes(text), `Missing history behavior: ${text}`);
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run `node prototype.test.mjs`.

Expected: FAIL on `recentGarden`.

- [ ] **Step 3: Add garden and star-map markup**

Place the recent garden inside the home scene:

```html
<div class="recent-garden" id="recentGarden" aria-label="最近保存的情绪花朵"></div>
```

Place this inside `#historyScene`:

```html
<div class="paper-panel history-panel">
  <button class="icon-button close-layer-button" id="closeHistoryButton" type="button"
    aria-label="关闭历史星图">×</button>
  <p class="paper-kicker">你的情绪宇宙</p>
  <h1 id="historyTitle">历史星图</h1>
  <p>每一颗星球，都是曾经被认真看见的一天。</p>
  <div class="history-map" id="historyMap"></div>
  <p class="empty-state" id="historyEmptyState">星图还是空的，第一颗星球正在等你。</p>
</div>
```

- [ ] **Step 4: Implement versioned storage and migration**

```js
const storageKey = "mood-mirror-history-v2";
const legacyStorageKey = "ai-emotion-diary-history";
const recentGarden = document.querySelector("#recentGarden");
const historyMap = document.querySelector("#historyMap");
const historyEmptyState = document.querySelector("#historyEmptyState");
const gardenButton = document.querySelector("#gardenButton");
const observatoryButton = document.querySelector("#observatoryButton");

function migrateHistory(items) {
  return items.map((item, index) => {
    const mood = item.mood in moodProfiles ? item.mood : "calm";
    const profile = moodProfiles[mood];
    return {
      id: item.id || `legacy-${index}-${mood}`,
      createdAt: item.createdAt || new Date(Date.now() - index * 1000).toISOString(),
      date: item.date || formatDate(new Date()),
      mood,
      moodLabel: item.moodLabel || profile.label,
      diary: item.diary || "",
      companion: item.companion || profile.companion,
      summary: item.summary || profile.summary,
      reason: item.reason || profile.reason,
      advice: item.advice || profile.advice,
      keywords: item.keywords || profile.keywords,
      quote: item.quote || profile.quote,
      source: item.source || profile.source,
      metaphorTitle: item.metaphorTitle || profile.metaphorTitle,
      metaphorText: item.metaphorText || profile.metaphorText,
      planetIndex: Number.isInteger(item.planetIndex) ? item.planetIndex : profile.planetIndex
    };
  });
}

function readHistory() {
  try {
    const current = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Array.isArray(current)) return migrateHistory(current);
    const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) || "[]");
    const migrated = migrateHistory(Array.isArray(legacy) ? legacy : []);
    if (migrated.length) writeHistory(migrated);
    return migrated;
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 60)));
}
```

- [ ] **Step 5: Render garden and history map with safe DOM APIs**

Do not interpolate diary text into `innerHTML`. Use `createElement` and `textContent`:

```js
function renderGarden() {
  const entries = readHistory().slice(0, 6);
  recentGarden.replaceChildren();
  entries.forEach((entry) => {
    const flower = document.createElement("button");
    flower.type = "button";
    flower.className = "history-flower";
    flower.dataset.mood = entry.mood;
    flower.setAttribute("aria-label", `${entry.date}，${entry.moodLabel}`);
    flower.addEventListener("click", () => openHistoryEntry(entry.id));
    recentGarden.append(flower);
  });
}

function renderHistoryMap() {
  const entries = readHistory();
  historyMap.replaceChildren();
  historyEmptyState.hidden = entries.length > 0;
  entries.forEach((entry, index) => {
    const planet = document.createElement("button");
    planet.type = "button";
    planet.className = "history-planet";
    planet.dataset.mood = entry.mood;
    planet.style.setProperty("--orbit-index", index);
    planet.textContent = entry.date;
    planet.addEventListener("click", () => openHistoryEntry(entry.id));
    historyMap.append(planet);
  });
}

function openHistoryEntry(entryId) {
  const entry = readHistory().find((item) => item.id === entryId);
  if (!entry) return;
  latestEntry = entry;
  renderEntry(entry);
  diaryText.value = entry.diary;
  setAppState("resonance-card");
}
```

- [ ] **Step 5a: Style garden flowers and history planets from the atlas**

```css
.history-flower,
.history-planet {
  --atlas-x: 0;
  appearance: none;
  border: 0;
  background-image: url("assets/emotion-planet/garden-atlas.png");
  background-size: 600% 200%;
  background-position: calc(var(--atlas-x) * 20%) 0%;
  background-repeat: no-repeat;
}

.history-planet {
  background-position: calc(var(--atlas-x) * 20%) 100%;
}

[data-mood="calm"] { --atlas-x: 0; }
[data-mood="happy"] { --atlas-x: 1; }
[data-mood="anxious"] { --atlas-x: 2; }
[data-mood="sad"] { --atlas-x: 3; }
[data-mood="tired"] { --atlas-x: 4; }
[data-mood="angry"] { --atlas-x: 5; }
```

- [ ] **Step 6: Implement save, return, and history controls**

```js
function saveLatestEntry() {
  if (!latestEntry) return;
  const entries = readHistory().filter((item) => item.id !== latestEntry.id);
  writeHistory([latestEntry, ...entries]);
  renderGarden();
  renderHistoryMap();
  showToast("这颗星球已经收藏进你的宇宙。");
  window.setTimeout(() => returnHome({ resetJournal: true }), 900);
}

function returnHome({ resetJournal = false } = {}) {
  if (journeyTimer) window.clearTimeout(journeyTimer);
  journeyTimer = null;
  homeTravelerSprite.classList.remove("traveler-sprite--running");
  if (resetJournal) {
    journalForm.reset();
    diaryText.value = "";
    characterCount.textContent = "0 / 400";
    selectedMood = "calm";
    moodButtons.forEach((button) => {
      const selected = button.dataset.mood === "calm";
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    latestEntry = null;
  }
  setAppState("home-idle");
}

gardenButton.addEventListener("click", () => {
  renderGarden();
  showToast(readHistory().length ? "最近的心情正在花园里发光。" : "第一朵花正在等你。");
});
observatoryButton.addEventListener("click", () => {
  renderHistoryMap();
  setAppState("history-map");
});
document.querySelector("#saveEntryButton")
  .addEventListener("click", saveLatestEntry);
document.querySelector("#returnHomeButton")
  .addEventListener("click", () => returnHome());
document.querySelector("#closeHistoryButton")
  .addEventListener("click", () => setAppState("home-idle"));

renderGarden();
```

- [ ] **Step 7: Verify persistence and revisit behavior**

Run `node prototype.test.mjs`.

Browser checks:

1. Save an entry; one flower and one history planet appear.
2. Refresh; both remain.
3. Open the history planet; the exact saved mood, diary, poem, and analysis appear.
4. Load legacy `ai-emotion-diary-history` data; it migrates without crashing.
5. A diary containing `<script>` displays as text and is never executed.

- [ ] **Step 8: Commit persistence and history**

```bash
git add ai-emotion-diary-prototype.html prototype.test.mjs
git commit -m "feat: add emotion garden and history universe"
```

### Task 8: Final Responsive Polish, Overview Update, and Verification

**Files:**
- Modify: `ai-emotion-diary-prototype.html`
- Modify: `project-overview.html`
- Modify: `overview.test.mjs`
- Test: `prototype.test.mjs`
- Test: `overview.test.mjs`

- [ ] **Step 1: Update overview contract**

Replace the old module list in `overview.test.mjs` with:

```js
const moduleNames = [
  "Module 1: 主星球场景",
  "Module 2: 日记对话层",
  "Module 3: 星际转场层",
  "Module 4: 共鸣星球场景",
  "Module 5: 历史星图层"
];

const requiredText = [
  "情绪星球",
  "主星球 + 共鸣星球",
  "电影感 3D",
  "水彩纸张 UI",
  "角色对话引导",
  "玫瑰花园",
  "历史星图",
  "localStorage",
  "ai-emotion-diary-prototype.html",
  "assets/emotion-planet/"
];
```

- [ ] **Step 2: Run overview test and verify it fails**

Run:

```bash
node overview.test.mjs
```

Expected: FAIL because the overview still describes seven old page modules.

- [ ] **Step 3: Update `project-overview.html`**

Keep the overview as a separate maintainable HTML document. Replace the old business-module section with five modules and update:

- Product positioning: “角色陪伴式 AI 情绪日记”
- Flow: “主星球 → 角色对话 → 日记输入 → 星际旅行 → 共鸣星球 → 收藏 → 花园/星图”
- Visual language: “电影感 3D 场景 + 水彩纸张 UI”
- MVP boundary: simulated AI, generated fixed assets, localStorage, no account/back end
- Prototype comments: explain why the world structure exists and what later real-AI integration changes

Do not include implementation notes inside the end-user prototype.

- [ ] **Step 4: Complete responsive and accessibility CSS**

Verify and implement:

```css
button:focus-visible,
textarea:focus-visible {
  outline: 3px solid rgba(255, 224, 153, .95);
  outline-offset: 4px;
}

.icon-button {
  inline-size: 44px;
  block-size: 44px;
}

@media (max-width: 700px) {
  .paper-panel {
    width: calc(100% - 20px);
    max-height: calc(100svh - 20px);
    overflow: auto;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 701px) {
  .journal-panel {
    width: min(520px, 42vw);
    margin: auto 4vw 4vh auto;
  }

  .resonance-card {
    width: min(640px, 48vw);
    margin: auto 4vw 4vh auto;
  }
}
```

Add descriptive tooltips using `title` only for unfamiliar icon-only controls; keep accessible names through `aria-label`.

- [ ] **Step 5: Run all automated tests**

Run:

```bash
node --test prototype.test.mjs overview.test.mjs
```

Expected:

```text
tests 2
pass 2
fail 0
```

- [ ] **Step 6: Run browser verification at desktop and mobile sizes**

Start a local server:

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765/ai-emotion-diary-prototype.html` and verify:

Desktop viewport `1440x900`:

- Home planet fills the viewport without blank borders.
- Traveler and both landmarks are visible and clickable.
- Journal panel does not cover the traveler’s face.
- Journey completes and skip works.
- Resonance text fits and card controls remain visible.
- History map opens and closes.

Mobile viewport `390x844`:

- Portrait background is used.
- Journal bottom sheet remains within viewport.
- Longest mood label and button copy do not overflow.
- Resonance card scrolls internally without moving the scene incoherently.
- No horizontal overflow.

Also inspect browser console logs. Expected: no errors and no missing-asset requests.

- [ ] **Step 7: Verify reduced-motion behavior**

Emulate `prefers-reduced-motion: reduce`.

Expected:

- No long running, meteor, or particle animation.
- State changes still occur.
- The complete workflow remains usable.

- [ ] **Step 8: Commit final polish and documentation**

```bash
git add ai-emotion-diary-prototype.html project-overview.html prototype.test.mjs overview.test.mjs
git commit -m "feat: complete emotion planet prototype"
```

- [ ] **Step 9: Review final repository status**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: no unintended modified files; commits show contract, assets, home, journal, journey, resonance, history, and final polish in order.

## Final Acceptance Checklist

- [ ] Home planet, journal dialogue, travel, resonance, and history are separate, state-driven modules.
- [ ] All six moods update copy and resonance-world imagery.
- [ ] Blank diary submissions are blocked with a companion-style message.
- [ ] Journey can be skipped and respects reduced motion.
- [ ] Save updates both the recent garden and complete history map.
- [ ] Legacy history migrates to `mood-mirror-history-v2`.
- [ ] User diary text is rendered with `textContent`, not interpolated HTML.
- [ ] Desktop and mobile use purpose-built compositions.
- [ ] All generated images are text-free and used as assets, not as embedded UI.
- [ ] Automated tests pass and browser console is clean.
- [ ] Product overview matches the implemented prototype.
