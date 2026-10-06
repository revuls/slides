---
name: review-presentation
description: Review and quality-check a presentation deck. Validates the JSON, audits the rendered slides (overflow, broken images, animation errors), and checks story, facts, density, accessibility and consistency, returning a prioritized findings list. Use before presenting or publishing a deck, or when asked to review, check, proofread or improve one.
---

# Review a presentation

Default stance: **report, don't rewrite**. Return findings with concrete fixes; only edit files if the user asked you to apply them.

## Pass 1 — Static validation (always)

```bash
node scripts/validate-deck.mjs data/<deck>.json        # add --json for machine-readable output
```
Errors must be fixed. Warnings are judgment calls: fix them unless there is a reason not to.

## Pass 2 — Rendered audit (when a browser is available)

1. `npm run serve` (or any static server on the repo root).
2. Open `http://localhost:8765/?src=data/<deck>.json`.
3. In the page console run:
   ```js
   await Slides.audit()      // → { ok, slides, theme, issues: [{ slide, type, severity, message }] }
   ```
   It reports render errors, content that overflowed and was auto-shrunk, content outside the safe area, images replaced by placeholders and animations that fail or do not run. Slides with `zoom` shrinking are usually too dense: shorten or split.
4. Visual spot-check (screenshots if you can): cover, the densest slide, every `animation`, every `table`/`charts`, the closing slide. Look for text over busy areas, clipped labels, low contrast, awkward empty space.
5. Press `G` (overview) to see the rhythm of the whole deck, `T` for dark mode, `C` to cycle themes.

No browser? Say so, run Pass 1 and review the JSON by reading it; ask the user to run `await Slides.audit()` and paste the result.

## Pass 3 — Content review checklist

**Story**: clear hook, logical sections, one idea per slide, a takeaway at the end, `cover` first and `closing` last. Length fits the time (≈ 1 slide/minute).
**Density**: titles ≤ 8 words; blocks ≤ 40 words; ≤ 4–5 items per list; no wall-of-text slides.
**Rhythm**: slide types vary (no three in a row); visual slides (`big-number`, `charts`, `hero`, `animation`) are spread out.
**Numbers**: units inside the strings; consistent formatting; ranges and `≈` for estimates; totals add up; chart `data` length equals `labels`.
**Facts**: every date, figure, name and causal claim is correct and sourced; dated knowledge is flagged; nothing invented. Spot-check at least five claims (the most striking ones first) and use the `research-topic` skill for doubtful ones.
**Sensitive topics**: respectful, factual wording; no sensationalism; quotations short, attributed and translations flagged.
**Notes**: key slides have `notes` (sources, caveats, what to say).
**Images & logos**: no fabricated third-party logos; placeholders replaced or acknowledged; alt-worthy context in captions.
**Language**: consistent language and sentence case; no typos; terminology consistent.

## Pass 4 — Animation review

Purpose clear (one idea)? Loop obvious and smooth (fade at the end)? Labels ≥ 22 px and not under the title card or logo? Colors from `api.colors`? Illustrative parts disclosed? Works in dark mode and in at least two themes? Thumbnail (`api.static`) informative? No console errors.

## Accessibility

Contrast: text on brand color must reach ≥ 4.5:1 (white on the theme's `--brand`); small gray text on tinted backgrounds must stay readable. Minimum visible text ≈ 20 px at 1920 wide. Motion: the engine honors `prefers-reduced-motion`; avoid flashing > 3 times per second.

## Report format

```
## Verdict: <ready | ready with fixes | needs work>
Validator: X errors, Y warnings · Audit: ok/not run · Slides: N · Animations: M

### Blockers
- Slide 7 (table): row 3 has 4 cells but 5 headers → add the missing cell.
### Major
- …
### Minor / polish
- …
### What works well
- …
```
Order findings by severity, cite the slide number and type, and give the exact fix (field and new value). Keep it short enough to act on.
