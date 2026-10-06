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
2. `Ctrl/Cmd+P` (or the dock's printer button) → **Save as PDF**.
3. Layout **Landscape**, margins **None**, enable **Background graphics**. Every slide becomes one 1920×1080 page; charts and counters are rendered in their final state and animation slides print as a still frame.

## Share / publish (GitHub Pages)

The engine is static, so any static host works. With GitHub Pages: repository **Settings → Pages → Deploy from a branch → `main` / root**. The deck URL becomes
`https://<user>.github.io/<repo>/?src=data/<deck>.json`.

Caution: animation slides **execute JavaScript from the deck**. Only publish decks you wrote, and only open decks from sources you trust.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not load …" toast with `?src=` | Serve over HTTP (`npm run serve`) or use Load JSON. |
| Animation slide shows an error box | Read the message; usual causes: wrong `src` path (relative to `index.html`), file not wrapped in `registerAnimation(...)`, JS error. Run `npm run validate`. |
| Images missing | The URL failed (hotlinking/typo); the engine shows a placeholder. Replace the URL. |
| Slide content looks small | The slide was auto-shrunk because it overflowed: shorten text or split the slide (`await Slides.audit()` lists them). |
| Fonts/icons missing offline | They load from CDNs; connect once or self-host them. |
