---
name: create-animation
description: Write a full-screen, looping, theme-aware JavaScript canvas animation for a slide of type "animation" (didactic simulations, process visuals, algorithm or system explanations). Use when a deck needs motion, when asked for an animation, or when editing files in animations/.
---

# Create an animation

An `animation` slide runs your code on a 1920×1080 canvas, in a loop, only while the slide is visible. It restarts from zero every time the slide is shown.

## When (and when not)

Use it when **time or space is the idea**: a process unfolding, an algorithm, a physical/astronomical system, a network, a transformation, a time series. If a static slide (`process`, `cycle`, `charts`, `timeline`) says it just as well, use that instead.

## Design brief first (30 seconds)

Write down: the **one idea** shown; the **loop** (what repeats, 12–25 s); the **phases** (e.g. input → process → result) with a short on-canvas caption for each; the **labels** needed (≥ 22 px, key ones ≥ 28 px); the **colors** (`brand` as the protagonist, `fg` dimmed for everything else).

## Contract

Two ways to ship it:

1. **Inline** in the deck: `"code": ["line 1", "line 2", …]` — the *body* of a function.
2. **File** in `animations/<name>.js`, referenced with `"src": "animations/<name>.js"` — the body wrapped in `registerAnimation(function (api) { … });` (the wrapper lets the file load from a `<script>` tag, so it also works when `index.html` is opened without a server).

**Sharing**: inline `code` only runs in trusted decks (same-origin `?src=` or local use). Uploaded, pasted or `#d=` link decks run in safe mode, where inline `code` is disabled until the viewer opts in, but `src: "animations/<name>.js"` keeps working. So for decks meant to be shared, put animations in `animations/` files.

Either way the code receives `api` and must **return** `{ frame }` (or a bare function), where `frame(dt, t)` draws one frame (`dt` seconds since the previous frame, `t` seconds since the slide appeared). Optional `resize()` and `destroy()` hooks.

Start from `animations/_plantilla.js` (interactive particles, fully commented). Full API: [`references/api.md`](references/api.md). Reusable patterns: [`references/recipes.md`](references/recipes.md). What the existing animations demonstrate: [`references/examples.md`](references/examples.md).

## Step by step

1. Copy `animations/_plantilla.js` to `animations/<topic>-<what>.js` (kebab-case, topic prefix).
2. Define constants and a cycle length `CYC`; compute the scene from `c = t % CYC` (a **pure function of time** is easiest to reason about and makes loops, replays and snapshots trivial).
3. Draw: `ctx.clearRect(0, 0, W, H)` first; use only `api.colors` for color; use `text(...)` for labels.
4. Add the loop end: fade out in the last ~0.8 s (`ctx.globalAlpha`) so the restart is smooth.
5. Handle snapshots: `api.static` is true for overview thumbnails and PDF export. Use a fixed `c` that shows the most informative moment (`const c = api.static ? 12 : t % CYC`).
6. Add the slide to a deck (`"type":"animation","src":"animations/<file>.js","title":"…","caption":"…"`).
7. **Test** (see below) and iterate on layout.

## Layout safe zones (1920×1080)

- The title card (`overlay`) sits top-left: roughly x 96–876, y 104–360. Keep important content out of it, or set `"overlay": false`.
- Top-right (x > 1400, y < 120) holds the logo; right-aligned counters/captions fit at y 190–330.
- The footer/page number occupy the bottom ~60 px (y > 1020). Keep text above y ≈ 990.
- Leave ≥ 90 px side margins. Scenes look best centered around (960, 640).

## Rules

- No network, `eval`, cookies, storage or DOM access outside `api.root` (the validator warns). No external libraries.
- Colors only from `api.colors` (they follow the active theme and dark/light mode). Natural colors for real objects (planets, sky) are fine as constants.
- Keep it light: < ~300 drawn objects per frame, avoid large `shadowBlur`, no per-frame allocations in hot loops.
- Seed any randomness (`sd = (sd * 16807) % 2147483647`) so every loop looks the same.
- Respect `api.reduced` (the engine already renders one still frame for reduced-motion users).
- Be truthful: if a curve or scale is illustrative, say so in the `caption` or on the canvas.
- In JSON `code` arrays use single quotes or template literals; avoid double quotes and backslashes.

## Test checklist

1. `node scripts/validate-deck.mjs data/<deck>.json` — syntax and wrapper checks.
2. `npm run serve`, open the deck, go to the slide; watch one full loop and the restart.
3. In the console: `await Slides.audit()` — must report no animation errors.
4. Overview (`G`) shows a meaningful thumbnail; toggle dark mode (`T`) and cycle themes (`C`): colors must stay legible.
5. Move the mouse over the canvas if it is interactive; check nothing breaks outside the window.
6. If you have screenshots: capture at three moments and check overlap with the title card and the page chrome.
