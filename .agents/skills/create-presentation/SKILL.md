---
name: create-presentation
description: Create a complete presentation for this slides engine from a topic, document or notes. Plans the story, picks slide types, theme and animations, writes the deck JSON in data/, validates it and previews it. Use whenever the user asks for a presentation, deck, slides, talk or pitch.
---

# Create a presentation

A deck is one JSON file `{ "meta": {...}, "slides": [...] }` in `data/`, rendered by `index.html`. There is no build step. Your job: turn an idea or source material into a deck that is accurate, visual and short.

## Workflow

1. **Clarify the brief** (ask only what you cannot infer; otherwise state your assumptions):
   audience, goal, duration (≈ 1 slide per minute; 12–20 slides is typical), language, tone, must-include facts. Write slide text in the language of the request.
2. **Gather facts** for factual topics (history, science, technology, business) with the `research-topic` skill. Never invent statistics, quotes, dates or sources. Mark estimates with `≈` or ranges and say so in the slide or `notes`.
3. **Outline the story** before writing JSON: hook → context → 3–5 sections → takeaway → close. One idea per slide. Choose the slide type for each beat from the table below; read [`references/slide-types.md`](references/slide-types.md) for exact fields and limits.
4. **Pick a theme** with the `theming` skill (default `ing`). Set `meta.brand` for themes other than `ing`/`marino`.
5. **Add 1–3 animation slides** where motion teaches something (see *Where animation helps*). Prefer an existing file in `animations/` via `"src"`; otherwise use the `create-animation` skill.
6. **Write the file** `data/<kebab-case-name>.json` (UTF-8, 2-space indent). Add `notes` to key slides.
7. **Validate**: `node scripts/validate-deck.mjs data/<file>.json` — fix every error and review every warning.
8. **Preview & audit**: `npm run serve`, open `http://localhost:8765/?src=data/<file>.json`, and in the browser console run `await Slides.audit()` (see the `review-presentation` skill). Fix overflow, broken images and animation errors. If you can take screenshots, look at the cover, one dense slide and every animation.
9. **Report**: file path, slide count, sections, animations used, theme, and honest caveats (approximate figures, placeholder or missing images, sensitive topics).

## Choosing slide types

| The beat is… | Use |
|---|---|
| Opening / closing | `cover` / `closing` |
| Chapter break | `section` |
| One surprising number | `big-number` |
| 3–4 KPIs | `number-grid` (or `gauges` for percentages of a goal) |
| A sentence that must land | `statement` or `quote` |
| Compare two options / before-after | `versus` or `split-text` |
| 3 principles or pillars | `features` |
| 5–8 short concepts | `icons` or `bullets` |
| Steps of a method | `process` (linear) or `cycle` (repeating) |
| Dates / history / roadmap | `timeline` (dated) or `gantt` (overlapping) |
| Hierarchy or levels | `pyramid` or `org` |
| How sets overlap / causes | `venn` |
| Data with a trend or share | `charts` (bar, line, area, doughnut, radar) |
| Exact values to compare | `table` |
| Conversion or drop-off | `funnel` |
| Tasks and status | `checklist` or `bars` |
| 2×2 reasoning (SWOT…) | `matrix` |
| Evidence from people | `testimonials`, `quote`, `team` |
| Atmosphere / context photo | `hero`, `image-text`, `gallery`, `image-cards`, `compare` |
| Q&A | `faq` |
| A process, system or algorithm that **moves** | `animation` |

## Where animation helps

Use `animation` when time or space is the point: a process unfolding (training, compiling, routing), an algorithm, a physical or astronomical system, a network, a before→after transformation, a time series being drawn. Do **not** use it for static diagrams that a `process`, `cycle` or `charts` slide already expresses. Keep it to 1–3 per deck, separated by text slides.

## Quality rules

- Titles ≤ 8 words, text blocks ≤ 40 words, sentence case; numbers with their unit inside the string so they animate (`"+15%"`, `"2.4M"`).
- Vary the rhythm: never the same type three times in a row; alternate dense and visual slides; ≤ 5 slides per section.
- Open with `cover`, close with `closing`; use `section` slides to structure decks above ~10 slides.
- Images: only absolute `https://` URLs (Unsplash or placehold.co). Do not claim an image shows something specific you cannot verify. Never invent third-party logos.
- Sensitive subjects (genocide, war, disasters, health): factual, respectful, sourced; no sensational wording.
- Quotes: short (< 15 words), attributed, translations flagged as such.
- Do not edit `index.html` to make a deck work; if a feature is missing, use the `extend-engine` skill.

## Output contract

Return the path of the new deck, how to open it, and a 3–5 line summary. Do not paste the whole JSON into chat unless asked.

## Examples to imitate

`data/sistema-solar.json` (science, 4 animations), `data/segunda-guerra-mundial.json` (history), `data/llm-wiki-karpathy.json` (tech talk, 2 animations), `data/historia-ia-generativa.json` (explainer), `data/revolucion-francesa.json`. Template for animation decks: `data/plantilla-animacion.json`.
