---
applyTo: "data/**/*.json"
description: Rules for presentation deck files
---
- A deck is `{ "meta": {...}, "slides": [...] }`. Every slide has a `type` from `.agents/skills/create-presentation/references/slide-types.md`.
- Titles ≤ 8 words, text blocks ≤ 40 words, sentence case. Numeric values include units inside the string (`"+15%"`, `"2.4M"`).
- Open with `cover`, close with `closing`, separate blocks with `section`, vary slide types, use 1–3 `animation` slides only where motion teaches.
- Images are absolute `https://` URLs (Unsplash / placehold.co). Never invent statistics, quotes, sources or third-party logos; mark estimates with `≈`.
- After editing run `node scripts/validate-deck.mjs <file>` and fix all errors.
- Use the `create-presentation` and `review-presentation` skills.
