---
name: theming
description: Choose, apply or create color themes for the slides engine (ing, marino, ocean, esmeralda, violeta, carmin), slide modes (light, dark, orange), logos and accessible contrast. Use when asked about colors, branding, look and feel, dark mode, logos, or to add a new theme.
---

# Theming

## The six themes

| `meta.theme` | Look | Good for |
|---|---|---|
| `ing` *(default)* | Orange `#FF6200` + near-black ink `#151515`, purple secondary | Corporate, finance, general business |
| `marino` | Orange + navy `#0B1A4A` | Corporate with a classic blue-and-orange feel |
| `ocean` | Blue `#0072CE` + deep ink | Technology, cloud, trust |
| `esmeralda` | Green `#0A8754` | Sustainability, health, nature |
| `violeta` | Purple `#6D28D9` | Innovation, AI, space |
| `carmin` | Crimson `#D81B4A` | History, culture, urgency |

Set in the deck: `"meta": { "theme": "violeta" }`. Override at runtime with `?theme=ocean` in the URL, the palette button in the dock, or the `C` key (cycles themes).

Match the theme to the subject; keep one theme per deck.

## Slide modes (`"theme"` on a slide)

`light` (white, tinted), `dark` (ink with a soft brand glow), `orange` (filled with the brand color; the name is historical, it uses the active theme's brand). Defaults: `cover`, `section`, `closing`, `hero`, `quote`, `big-number`, `animation` are dark; `statement` is orange; the rest are light. `T` forces every light slide to dark.

## Logo

`ing` and `marino` show the text wordmark "ING" by default. Other themes show nothing unless the deck sets `meta.brand` (text) or `meta.logo` (image URL). Never fabricate a real company's logo; use text or an official asset the user provides.

## How tokens work

CSS variables on `<html data-theme="…">` define everything:

| Token | Role |
|---|---|
| `--brand` | Main color: buttons, bars, accents on light slides, fills. White text must read on it (≥ 4.5:1). |
| `--brand-t` | Accent **on dark slides** (text, kickers, logo). Use a lighter tint of the brand when `--brand` is dark. |
| `--brand-l`, `--brand-xl`, `--brand-d` | Lighter, very light and darker variants (gradients, glows). |
| `--brand-rgb` | `r,g,b` of the brand for `rgba(var(--brand-rgb), .2)`. |
| `--ink`, `--ink-rgb` | Dark base: text on light slides and background of dark slides. |
| `--sec` | Secondary color (second chart series, secondary shapes). |
| `--tint-warm`, `--tint-blue` | Very light surfaces on light slides. |

Slides derive `--fg`, `--text`, `--muted`, `--card`, `--accent`… from the mode, so components never hard-code colors. Animations read the same palette through `api.colors`.

## Add a new theme

1. In `index.html`, next to the other `html[data-theme="…"]` rules, add one with all tokens above (`--brand`, `--brand-t`, `--brand-l`, `--brand-xl`, `--brand-d`, `--brand-rgb`, `--ink`, `--ink-rgb`, `--sec`, `--tint-warm`, `--tint-blue`).
2. Add it to the `THEMES` object in the script: `{ label, a: <brand hex>, b: <ink hex>, logo?: 'TEXT' }` (the swatch in the theme picker uses `a`/`b`).
3. Add the name to the allowed list in `scripts/validate-deck.mjs` (`THEMES`) and to this skill and `README.md`.
4. **Check contrast** (script below): white on `--brand` ≥ 4.5; `--brand-t` on `--ink` ≥ 4.5.
5. Test the new theme on: a light slide, a dark slide, `statement` (orange mode), a `charts` slide, `gauges`, an `animation` slide, the overview, and with `T` (dark mode).
6. Run `npm run validate`.

Avoid yellow/lime/very light brand colors: white text on them fails contrast.

```js
// WCAG contrast ratio between two #rrggbb colors
const L = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return ((x + .05) / (y + .05)).toFixed(2); };
ratio('#ffffff', '#0A8754')   // white on brand → must be ≥ 4.5
```
