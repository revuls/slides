---
applyTo: "index.html,scripts/**/*.mjs"
description: Rules for editing the engine and tooling
---
- `index.html` is a single-file vanilla engine with no build step: keep it that way and add no dependencies.
- Colors via tokens (`var(--brand)`, `rgba(var(--brand-rgb), .2)`), never hard-coded. Prefix new component classes by type to avoid collisions.
- Elements with `data-a` use `translate`/`scale` for entrance: do not use those properties for layout; wrap tilt cards with `cell()`.
- Adding a slide type means updating: `TYPES`, CSS, `scripts/validate-deck.mjs`, the slide-types reference, README and a demo slide.
- Run `npm test` and check `await Slides.audit()` in the browser. Follow the `extend-engine` skill.
