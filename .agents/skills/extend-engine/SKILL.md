---
name: extend-engine
description: Modify the slides engine itself (index.html, scripts/, validator): add or change slide types, themes, transitions, UI or runtime APIs safely, keeping docs, validator and demos in sync. Use when a feature or bug requires editing the engine rather than a deck.
---

# Extend the engine

The engine is **one file**, `index.html` (HTML + CSS + vanilla JS, no build). External dependencies are limited to Chart.js, Phosphor Icons and Google Fonts (CDN). Do not add libraries lightly; a 3D library (three.js) was tried and removed because it did not improve on the 2D canvas animations.

## Map of `index.html`

| Area (comment banner) | What lives there |
|---|---|
| `TEMAS GLOBALES` | Theme tokens (`html[data-theme]`). |
| `BACKDROP + STAGE`, `SLIDE BASE + THEMES` | 1920×1080 stage scaled with CSS; slide modes `light` / `dark` / `orange`. |
| `SLIDE TRANSITIONS`, `ENTRANCE ANIMATIONS (data-a)` | Directional wipe/fade/zoom; staggered entrance via `data-a` attributes. |
| `TYPOGRAPHY`, `CARDS + TILT` and per-type CSS | Component styles (use tokens, never hard-coded colors). |
| `UI: DOCK / OVERLAYS`, `MÓVIL`, `PRINT / PDF` | Dock, overview, notes, help, toast; mobile rules (`body.compact` = width ≤ 900 px or height ≤ 520 px: edge-to-edge slide, safe-area insets, responsive dock/modals, ≡ button `#fab` on touch, touch gestures in section 8); print stylesheet (one 1920×1080 page per slide). |
| `1. DATOS POR DEFECTO` | `defaultJSON`: demo deck shown when no deck is loaded. |
| `2. HELPERS` | `ic()`, `words()`, `hd()` (slide header), `cell()` (tilt wrapper), `rt()`, `hl()` code highlighter. |
| `3. TIPOS DE SLIDE` | `TYPES = { name: { theme?, fx?, nofoot?, render(slide, ctx) } }` — one HTML renderer per type. |
| `4. ESTADO + RENDER` | `THEMES`, global state `G`, `slideHTML()`, `fitSlide()` (auto-shrink), `buildPresentation()`. |
| `5–6b` | Counters, particles (`FX`), full-screen animations (`Anim`, `registerAnimation`). |
| `7. GRÁFICOS` | Chart.js wrappers (palette read from CSS variables). |
| `8. NAVEGACIÓN`, `9. CARGA DE JSON`, `10. INICIO`, `11. AUDITORÍA` | Navigation, overview, shortcuts, loading (file/drag-drop/paste/`#d=` link/`?src=`), trust model + `sanitizeDeck()`, share links, `Slides.audit()`. |

Public runtime API: `Slides.load(deck, { untrusted: true })` (trusted unless `untrusted`), `Slides.go(n)`, `Slides.next()`, `Slides.prev()`, `await Slides.audit()`.

## Conventions and gotchas (learned the hard way)

- **Entrance animations** use the individual `translate`/`scale`/`opacity` properties via `data-a="up|left|right|zoom|pop|blur|grow|reveal|fade"`. Never position an element with `translate` or `scale` if it carries `data-a`; use `left/top/margin`. Tilt cards use `transform`, so wrap them with `cell(...)` (the wrapper owns `data-a`).
- **Canvas memory**: every `<canvas>` keeps its backing store (1920×1080×r×4 bytes) until its size is reset. `FX`/`Anim` call `release()` (width=height=0) one second after the slide is left (and the overview grid is emptied on close); anything new that allocates a big canvas per slide must do the same, or iOS Safari kills the tab after a few slides ("No se puede abrir la página"). Check with the sum of `canvas.width*height*4` after walking a whole deck.
- **Scope CSS to direct children** (`.thumb>span`, not `.thumb span`): descendant selectors leak into slide content (this broke overview thumbnails once; `.thumb.cur` also collided with the typewriter `.cur`).
- **Unique class names**: a generic class like `.on` once collided with the dock's active state. Prefix new component classes with the type (`.vn-`, `.gt-`, `.cl-`…).
- **CSS custom properties registered with `@property`** (`--p` for the compare slider) become typed: never reuse such a name for another purpose (the progress bar silently broke once; it now uses `--prog`).
- **Chart.js** canvases are sized in layout pixels (not CSS-scaled) and re-created when the stage scale changes.
- Colors only via tokens (`var(--brand)`, `var(--ink)`, `rgba(var(--brand-rgb), .2)`); text on `--brand` is white.
- Text fields accept inline HTML; titles can be split word-by-word by `words()` (plain text only).
- Slides must keep working in `static` mode (overview thumbnails, print): do not depend on running timers for visibility.
- Escape nothing twice. Trusted decks (same-origin `?src=`, `Slides.load()`) are rendered as-is (inline HTML, animation JS). **Untrusted decks** (upload, drop, paste, `#d=` link, cross-origin `?src=`) go through `sanitizeDeck()` (section 9) and `G.animOK=false`: any new field that is rendered inside an HTML attribute or as a URL must stay safe after sanitizing (double quotes become `”`, URL-like strings are percent-encoded); never add `href`, `iframe src`, `innerHTML` or event-handler sinks fed by deck data without extending the sanitizer and testing a hostile deck.
- Keep the UI strings in English; deck content is the author's language. (Some legacy UI strings are Spanish; leave them unless asked.)

## Add a slide type — checklist

1. **Renderer** in `TYPES`: set `theme` (default mode) and `nofoot`/`fx` when needed; use `hd(s)` for the standard header, `cell()` for tilt cards, `data-a` for entrance.
2. **CSS** under a type prefix, using tokens; check dark and orange modes (`.dark`, `.orange` overrides when needed).
3. **Limits**: slice arrays to the supported maximum; consider `fitSlide()` (it shrinks `.body` children when content overflows).
4. **Static/print**: verify the overview thumbnail and print preview.
5. **Validator**: add the type to `scripts/validate-deck.mjs` (`R` table, plus a `custom` function for cross-field rules).
6. **Docs**: add the type to `.agents/skills/create-presentation/references/slide-types.md` and the selection table in the `create-presentation` skill; update `README.md` counts; update `prompt.md` (Spanish chat prompt) only if asked.
7. **Demo**: add an example slide to a deck in `data/` (or a new one) and, if useful, to `defaultJSON`.
8. **Test**: `npm run validate`; `npm run serve`; `await Slides.audit()`; overview (`G`), dark mode (`T`), every theme (`C`), a narrow window and a phone-landscape viewport (812×375), PDF export.
9. Regenerate agent files if you touched `.agents/` (`npm run sync`), then `npm run check`.

## Other changes

- **New theme**: see the `theming` skill.
- **New shortcut/UI**: add to the `keydown` handler and the help overlay (`#help`); keep the dock hidden unless the mouse approaches the bottom edge.
- **New animation helper**: add to `animHelpers`/`Anim.api()` and document it in `.agents/skills/create-animation/references/api.md`.
- **Breaking JSON changes**: avoid; if unavoidable, support the old field as an alias and update the validator.

## Verify before finishing

`npm run validate` → 0 errors · `npm run check` → agent files in sync · browser: no console errors, `Slides.audit()` ok on at least `data/sistema-solar.json` and `data/segunda-guerra-mundial.json`.
