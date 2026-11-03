---
name: create-style
description: Create or edit a presentation style for the slides engine, a file in styles/ that changes the layout, markup, typography, header, footer and decoration of a whole deck, not only its colors. Use when asked for a new look, template, design system, layout or visual identity, to copy the look of a reference, or when editing files in styles/.
---

# Create a presentation style

Three independent layers decide how a deck looks. Pick the right one before writing anything:

| Layer | Changes | Lives in | Chosen with | Key |
|---|---|---|---|---|
| **Style** | Markup, layout, type, header, footer, decoration | `styles/<id>.js` | `meta.style`, `?style=` | `S` |
| **Theme** | Colors only | `index.html`, or `themes` in a style | `meta.theme`, `?theme=` | `C` |
| **Mode** | Light, dark or brand background of a slide | Engine | `meta.mode`, `slide.theme` | `T` |

If only the colors change, use the `theming` skill. A deck without `meta.style` uses the engine's own look (`default`).

## Steps

1. **Write a one-paragraph brief**: the reference (poster, magazine, terminal, a brand), the type pairing, the grid and margins, and what replaces cards. Decide what makes it recognizable at thumbnail size: if the overview looks like the default with other colors, the style is not done.
2. **Copy the template**: `styles/_plantilla.js` → `styles/<id>.js` (lowercase letters, digits and dashes). Delete what you do not change.
3. **Set the base**: `label`, `description`, `fonts`, `themes` + `theme`, and in `css` the fonts (`--font-head`, `--font-body`) and the backgrounds of `.slide`, `.slide.dark` and `.slide.orange`.
4. **Replace the frame**: `header`, `chrome` and `decor`. This alone changes every slide that uses `hd()`.
5. **Flatten what is inherited**: in `css`, restyle the classes base renderers share (`.card`, `.pane`, `.ibub`, `.mv`, `.kicker`, `.tl-node`, `.tbl`…) so the other types belong to the same design.
6. **Replace the renderers that define the look**: at least `cover`, `section`, `features`, `number-grid`, `quote`, `statement`, `closing`, then `agenda` or anything that still looks out of place.
7. **Register it**: `npm run sync` adds it to the picker and to the chat prompts.
8. **Verify** (see below).

`styles/editorial.js` (sidebar spreads, running head, a new slide type) and `styles/suizo.js` (full-bleed grid, poster type) are complete examples.

## The definition

`registerStyle(function (api) { return { … }; })`. Everything is optional except `label`.

| Field | Purpose |
|---|---|
| `label`, `description` | Name in the picker. Description for the chat prompts: what it looks like and when to use it. |
| `theme`, `mode`, `transition` | Defaults. The deck's `meta.theme`, `meta.mode` and `meta.transition` win. |
| `fonts` | Google Fonts families, the part after `family=`. No other font hosts. |
| `themes` | Palettes that exist only with this style: `{ id: { label, a, b, vars: { '--brand': … } } }`. Include every token in the `theming` skill. |
| `safe` | `{ bottom, right }` limits for `Slides.audit()` if your margins differ from the default (985, 1815). |
| `header(s)` | Header HTML for every type that calls `hd()`. |
| `chrome(s, c)` | Inner HTML of the fixed layer (page number, footer, logo). Respect `c.nofoot`. |
| `decor(s, c)` | Background elements. Return `''` to drop the engine's glows. |
| `types` | Slide types: `{ name: { theme, fx, nofoot, render(s, c), rules } }`. |
| `css` | Loaded only while the style is active, after the engine's CSS. |

`c` is `{ i, total, meta, sec, static, nofoot, logo, deckTitle }`.

`api` gives the engine helpers (`ic`, `words`, `stmtWords`, `hd`, `cell`, `rt`, `pad`, `strip`, `ramp`, `numOf`, `initials`, `rings`, `hl`, `tone`, `FB`) and `api.base` with the engine's own `types`, `header`, `chrome` and `decor`, to wrap them: `render: (s, c) => api.base.types.table.render(s, c)`. Use `api.base.header`, not `api.hd`, inside `header`: `api.hd` calls your `header` again.

### Types: replace, adjust or add

- **Same name as a built-in type**: the properties you set replace the built-in ones and the rest are inherited. `{ theme: 'light' }` only changes its default mode. If the original has `fx: 1` and your layout is light, set `fx: 0`.
- **New name**: a type only this style has. Add `rules` so the validator can check it (same format as the `R` table in `scripts/validate-deck.mjs`). A deck using it shows an error slide under any other style, so prefer replacing built-in types: those decks work in every style.

## Renderer contract

- Wrap content in `<div class="inner">`, and put what can overflow in `<div class="body">`: `fitSlide()` shrinks `.body` and `Slides.audit()` measures `.inner`.
- Read the same fields as the built-in renderer (`slide-types.md`), so any deck works when its style changes. Copy the original from `TYPES` in `index.html` as a starting point.
- Keep `class="count" data-count="…"` on numbers that count up, and `canvas[data-ci]` on charts.
- Entrance animations use `data-a`. Never position such an element with `translate` or `scale`; use `left`, `top` or margins. See `extend-engine` for the other gotchas.
- Content must be visible in static mode (overview, print) without timers.
- Render deck text only as element content. Do not put deck fields in new `href`, `src`, `style` or event-handler attributes: untrusted decks can choose any style in `styles/`.
- Prefix new classes (`.ed-`, `.sz-`) and use theme tokens (`var(--brand)`, `var(--fg)`, `var(--accent)`) in CSS. Text on `--brand` is white.

## Verify

```bash
npm run sync
npm test
```

Then open both of these and run `await Slides.audit()` in the console:

- `/?style=<id>`: the default deck, with 39 slide types.
- `/?src=data/demo-estilos.json&style=<id>`: the comparison deck.

Press `G` and review every thumbnail. Check dark mode (`T`), another theme (`C`), switching styles with `S` and back, a chart and an animation slide, and `npm run export:pdf -- data/demo-estilos.json out.pdf --style=<id>`.
