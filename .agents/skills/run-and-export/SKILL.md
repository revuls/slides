---
name: run-and-export
description: Serve, preview, present, export and publish decks from this repository (local server, ?src= URLs, keyboard shortcuts, PDF export, GitHub Pages). Use when asked to run, open, present, share, export or publish a presentation.
---

# Run, present, export, publish

## Run locally

```bash
npm run serve            # node scripts/serve.mjs → http://localhost:8765
```
Open a deck: `http://localhost:8765/?src=data/<deck>.json` (add `&theme=ocean` to override the theme, `#5` to jump to slide 5).
No Node? `python3 -m http.server 8765` works the same.

Opening `index.html` **without a server** (`file://`) also works, with one limit: `?src=` needs HTTP. Load a deck with the **Load JSON** button (move the mouse to the bottom edge to reveal the dock) or drag the `.json` file onto the window. Animation files in `animations/` load fine because they are `<script>` tags; keep the folder next to `index.html`.

## Present

| Key | Action |
|---|---|
| `→` `Space` `Enter` `PageDown` / `←` `Backspace` `PageUp` | Next / previous slide (touch swipe works too) |
| `Home` / `End` | First / last slide |
| `G` | Overview grid (click a thumbnail to jump) |
| `F` | Full screen |
| `T` | Toggle dark mode for all light slides |
| `C` | Cycle color themes (the palette button opens a picker) |
| `N` | Speaker notes panel |
| `?` | Shortcut help · `Esc` closes panels |

The control dock stays hidden while you navigate; it appears when the mouse approaches the bottom edge. Presenting tips: press `F`, check animations once on the actual projector/laptop, keep notes open on a second screen if you have one.

## Export to PDF

1. Open the deck in Chrome/Edge and wait for the first slide to render.
2. `Ctrl/Cmd+P` (or the dock's printer button) → **Save as PDF**. Both paths first put every slide in its final state (no entrance animations, counters and charts finished, animation slides frozen on a representative frame) and restore the live deck afterwards.
3. Layout **Landscape**, margins **None**, enable **Background graphics**. Every slide becomes one 1920×1080 page (N slides → N pages); charts and counters are rendered in their final state and animation slides print as a still frame.

**Without the print dialog** (scripts, CI, agents):

```bash
npm run export:pdf -- data/<deck>.json [out.pdf] [--theme=ocean]   # default output: next to the deck
```
It serves the repo on a random port and runs headless Chrome/Edge/Chromium against `?src=…&print`, which puts every slide in its final state. Set `CHROME_PATH` if the browser is not found; `--wait=<ms>` raises the virtual-time budget for very large decks. Needs network for fonts/icons. Check the result with `pdfinfo` (pages = slides).

## Share / publish (GitHub Pages)

The engine is static, so any static host works. With GitHub Pages: repository **Settings → Pages → Deploy from a branch → `main` / root**. The deck URL becomes
`https://<user>.github.io/<repo>/?src=data/<deck>.json`.

Caution: animation slides **execute JavaScript from the deck**. A deck is trusted only when loaded with `?src=` from the same origin as the page; uploaded, dragged, pasted, `#d=` link and cross-origin `?src=` decks open in **safe mode** (text sanitized, `code` animations disabled until the viewer opts in, `src` limited to `animations/*.js`). Only publish decks you wrote or reviewed.

### Open or share without a server

- **Paste**: `Ctrl/Cmd+V` on the page (or the clipboard button) opens a JSON copied from a chat, including a ```json fenced block.
- **Prompt for any chat AI**: the paste dialog's *Copiar prompt* button copies `prompt.en.md` (no animation slides). Use `prompt-animations.en.md` for decks you will run locally.
- **Link**: `L` (or the link button) copies `index.html#d=<deflate+base64url deck>` plus `&s=<slide>`; no backend. Keep decks shared this way free of inline `code` animations (use `src: "animations/<name>.js"`, which works on any host that ships that file). Links above ~30 KB may break in chat apps: host the JSON and share `?src=<url>` (CORS must allow it; it opens in safe mode unless same origin).

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not load …" toast with `?src=` | Serve over HTTP (`npm run serve`) or use Load JSON. |
| Animation slide shows an error box | Read the message; usual causes: wrong `src` path (relative to `index.html`), file not wrapped in `registerAnimation(...)`, JS error. Run `npm run validate`. |
| Images missing | The URL failed (hotlinking/typo); the engine shows a placeholder. Replace the URL. |
| Slide content looks small | The slide was auto-shrunk because it overflowed: shorten text or split the slide (`await Slides.audit()` lists them). |
| Fonts/icons missing offline | They load from CDNs; connect once or self-host them. |
