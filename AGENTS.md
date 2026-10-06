# AGENTS.md — Slides engine

Instructions for AI coding agents (Codex, GitHub Copilot, Claude Code and others). Humans: see [README.md](README.md).

## What this repository is

A **JSON-driven web presentation engine**. `index.html` (single file, vanilla HTML/CSS/JS, no build step) renders a deck from a JSON file: 40 slide types, 6 color themes, animated counters/charts, a vector overview, speaker notes, PDF export, and full-screen **JavaScript canvas animations**. Decks live in `data/`, animations in `animations/`.

## Commands

```bash
npm run serve              # static server → http://localhost:8765  (open ?src=data/<deck>.json)
npm run validate           # validate every data/*.json   (node scripts/validate-deck.mjs [file…] [--json] [--strict])
npm run sync               # regenerate agent files from .agents/ (Claude, Copilot, Codex) + prompt.en.md
npm run check              # verify .agents/ sources are valid and generated files are in sync
npm test                   # check + validate
```
Node ≥ 18, no dependencies. In a browser console: `await Slides.audit()` → `{ ok, issues[] }` (render errors, overflow, broken images, animation errors).

## Repository map

| Path | What |
|---|---|
| `index.html` | The engine. Section banners map the code (themes, stage, TYPES, `Anim`, charts, navigation, `Slides.audit`). |
| `data/*.json` | Decks (`meta` + `slides`). `data/plantilla-animacion.json` is a starter. |
| `animations/*.js` | Full-screen animations, each wrapped in `registerAnimation(function (api) { … })`. `_plantilla.js` is the template. |
| `scripts/` | `validate-deck.mjs`, `serve.mjs`, `sync-agents.mjs`, `prompt-header.en.md`. |
| `.agents/skills/` | **Skills** (Agent Skills standard): the knowledge. Source of truth. |
| `.agents/agents/` | **Agents** (neutral definitions): the roles. Source of truth. |
| `.claude/`, `.github/agents/`, `.codex/agents/` | Generated per-tool agent files (+ `.claude/skills` symlink). **Do not edit.** |
| `prompt.md` / `prompt.en.md` | Paste-into-any-chat prompts (Spanish original / generated English). |

## Skills (load the one that matches the task)

| Skill | Use it to |
|---|---|
| `create-presentation` | Build a deck from a topic or document (story → slide types → JSON → validate → preview). Contains the full slide-type catalog. |
| `create-animation` | Write a looping canvas animation for an `animation` slide. Contains the API, recipes and safe zones. |
| `review-presentation` | QA a deck: validator, `Slides.audit()`, content/facts/accessibility checklist, report format. |
| `theming` | Pick or add a color theme; slide modes; logos; contrast. |
| `research-topic` | Produce a verified, sourced fact pack before writing a factual deck. |
| `extend-engine` | Change `index.html`/validator safely (architecture map, gotchas, checklists). |
| `run-and-export` | Serve, present, export to PDF, publish on GitHub Pages, troubleshoot. |

## Agents (roles that use those skills)

| Agent | Role | Writes files? |
|---|---|---|
| `presentation-architect` | Brief → finished, validated deck | `data/`, `animations/` |
| `content-researcher` | Verified fact pack with sources | no |
| `animation-engineer` | Create/debug animations | `animations/`, decks |
| `presentation-reviewer` | Independent QA report | no |
| `engine-developer` | Engine/validator/docs changes | `index.html`, `scripts/`, docs |

**Typical workflow for a new deck**: `content-researcher` (if facts matter) → `presentation-architect` (outline, deck, 1–3 animations via `animation-engineer` when custom motion is needed) → `presentation-reviewer` → fix findings → run-and-export. Agents that cannot delegate should simply follow the matching skill themselves.

## Conventions and guardrails

- **Language**: reply in the user's language. Code, comments, docs, skills and agents are in English. Deck text is in the language of the request (existing sample decks are in Spanish).
- **Never invent facts**: no made-up statistics, quotes, dates, sources, or third-party logos. Mark estimates with `≈`/ranges and say so. Treat sensitive subjects (war, genocide, disasters, health) with sober, factual wording.
- **Decks are data; the engine is code**: do not edit `index.html` to make one deck work. If a capability is missing, use the `extend-engine` skill and keep validator + docs + demo in sync.
- **Animation slides execute JavaScript** from the deck: no network, `eval`, storage or DOM access outside `api.root`; only load decks from trusted sources.
- **Colors** come from theme tokens (`var(--brand)`…) in CSS and `api.colors` in animations; never hard-code a palette.
- **No new dependencies** (the engine uses Chart.js, Phosphor Icons and Google Fonts from CDNs). A 3D library was evaluated and removed: do not re-add it without a clear need.
- **Generated files**: edit `.agents/skills/**`, `.agents/agents/*.md` or `scripts/prompt-header.en.md`, then run `npm run sync`. CI fails if they drift.
- **Git**: do not commit, push or open pull requests unless asked. Never commit secrets.
- Keep changes small and focused; match the existing style (2-space indent, single quotes in JS).

## Definition of done

- **New/edited deck**: `npm run validate` has 0 errors and warnings were reviewed; opened in the browser; `await Slides.audit()` is `ok`; animations watched through one loop; caveats reported.
- **New/edited animation**: validator passes; one full loop watched; overview thumbnail meaningful; dark mode and another theme checked.
- **Engine change**: `npm test` passes; `Slides.audit()` ok on `data/sistema-solar.json` and `data/segunda-guerra-mundial.json`; overview, dark mode (`T`), all themes (`C`) and print preview checked; docs updated.
- **Agent/skill change**: `npm run sync` then `npm run check`.
