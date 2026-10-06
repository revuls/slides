# Slides

A **JSON-driven web presentation engine**: write a deck as one JSON file and present it in the browser with animated transitions, charts, counters, six color themes, speaker notes, PDF export and **full-screen JavaScript animations**. It ships with a complete set of **AI agents and skills** that work with **Claude Code, GitHub Copilot and Codex**, so an assistant can research, write, animate and review presentations for you.

- **One HTML file, no build.** `index.html` is vanilla HTML/CSS/JS. Open it, or serve the folder.
- **40 slide types** — covers, KPIs, charts, timelines, Gantt, funnels, org charts, comparisons, galleries, code, video and more.
- **Animated by default** — directional transitions, staggered entrances, counters that count up, drawing charts, word-by-word titles, tilt cards.
- **Looping canvas animations** that fill a whole slide, to explain processes, algorithms and systems visually.
- **6 themes** (`ing`, `marino`, `ocean`, `esmeralda`, `violeta`, `carmin`) switchable live.
- **Agent-ready**: skills, agents, validator and an in-browser audit that any AI tool can run.

> The sample decks in `data/` are written in Spanish; the engine, tooling and documentation are in English.

---

## Quick start

```bash
git clone https://github.com/revuls/slides.git
cd slides
npm run serve        # → http://localhost:8765   (Node ≥ 18, no dependencies)
```

Open a sample deck:

```
http://localhost:8765/?src=data/sistema-solar.json
```

No Node? `python3 -m http.server 8765` works too. You can also open `index.html` directly (without a server) and load a deck with the **Load JSON** button or by dragging a `.json` file onto the window; `?src=` requires HTTP.

### Sample decks

| Deck | Topic | Slides | Animations | Theme |
|---|---|---|---|---|
| `data/sistema-solar.json` | The Solar System | 20 | 4 | `violeta` |
| `data/segunda-guerra-mundial.json` | World War II | 24 | 3 | `marino` |
| `data/llm-wiki-karpathy.json` | Karpathy's "LLM Wiki" pattern | 14 | 2 | `ing` |
| `data/historia-ia-generativa.json` | History of generative AI | 26 | 0 | `violeta` |
| `data/revolucion-francesa.json` | The French Revolution | 29 | 0 | `carmin` |
| `data/demo-animaciones.json` | Animation showcase | 5 | 3 | `ing` |
| `data/plantilla-animacion.json` | **Template** for a deck with an animation | 3 | 1 | `ing` |
| `data/llm-wiki.json` | Original sample (LLM Wiki, compiled vs RAG) | 11 | 0 | `ing` |

With no `?src=` the engine shows a built-in demo deck.

---

## Present

| Key | Action |
|---|---|
| `→` `Space` `Enter` `PageDown` / `←` `Backspace` `PageUp` | Next / previous slide (swipe on touch) |
| `Home` / `End` | First / last slide |
| `G` | Overview grid |
| `F` | Full screen |
| `T` | Dark mode for light slides |
| `C` | Cycle color themes (the palette button opens a picker) |
| `N` | Speaker notes |
| `?` | Shortcut help · `Esc` closes panels |

The control dock stays out of the way while you navigate: move the mouse to the bottom edge to reveal it (Load JSON, PDF, themes, full screen…).

URL options: `?src=data/x.json` · `&theme=ocean` · `#5` (open on slide 5).

**Export to PDF**: open the deck in Chrome/Edge → print → *Save as PDF* → Landscape, margins *None*, *Background graphics* on. One 1920×1080 page per slide; animation slides print as a still frame.

---

## Write a deck

A deck is a JSON file with `meta` and `slides`:

```json
{
  "meta": { "title": "Quarterly review", "date": "October 2026", "author": "Finance", "theme": "ocean", "transition": "slide" },
  "slides": [
    { "type": "cover", "title": "Quarterly review", "subtitle": "Results and outlook" },
    { "type": "number-grid", "title": "Key figures", "metrics": [
      { "value": "+15%", "label": "Gross margin", "desc": "vs. last year" },
      { "value": "2.4M", "label": "New users", "desc": "100% digital" }
    ]},
    { "type": "animation", "title": "How the pipeline works", "src": "animations/red-neuronal.js" },
    { "type": "closing", "title": "Thank you" }
  ]
}
```

Numbers keep their unit inside the string (`"+15%"`, `"2.4M"`) so they animate counting up. Inline HTML is allowed in text. Add `notes` to any slide for speaker notes.

**Every slide type, with fields, limits and examples:** [`.agents/skills/create-presentation/references/slide-types.md`](.agents/skills/create-presentation/references/slide-types.md)

| Category | Types |
|---|---|
| Opening & structure | `cover` `section` `agenda` `closing` |
| Impact | `hero` `statement` `big-number` `quote` |
| Cards & lists | `features` `icons` `bullets` `split-text` `versus` `matrix` `plans` `testimonials` `faq` |
| Numbers & data | `number-grid` `gauges` `bars` `funnel` `table` `charts` (bar, hbar, line, area, radar, doughnut, pie) |
| Process & time | `timeline` `process` `cycle` `gantt` `pyramid` `venn` `org` |
| People & media | `team` `image-text` `gallery` `image-cards` `compare` `video` `logos` `code` |
| Motion | `animation` |

Validate before presenting:

```bash
npm run validate                  # every deck in data/
node scripts/validate-deck.mjs data/my-deck.json
```

### Themes

`meta.theme`: `ing` (default: orange + ink) · `marino` (orange + navy) · `ocean` (blue) · `esmeralda` (green) · `violeta` (purple) · `carmin` (crimson). A slide can also set its own mode (`"theme": "light" | "dark" | "orange"`). Only `ing`/`marino` show the "ING" wordmark; for other themes set `meta.brand` (text) or `meta.logo` (image URL). Details and how to add a theme: the `theming` skill.

---

## Full-screen animations

An `animation` slide runs your code on a 1920×1080 canvas in a loop, only while the slide is visible:

```json
{ "type": "animation", "title": "Bubble sort", "caption": "Compare neighbors and swap if out of order.",
  "src": "animations/ordenacion.js", "params": { "count": 26, "speed": 1 } }
```

Write the code inline (`"code": ["line 1", "line 2"]`) or in a file wrapped in `registerAnimation(function (api) { … })`:

```js
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, text, TAU } = api;
  function frame(dt, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.brand;
    ctx.beginPath(); ctx.arc(W / 2 + Math.sin(t * 2) * 300, H / 2, 40, 0, TAU); ctx.fill();
    text('Hello', W / 2, H - 200, { size: 48, align: 'center' });
  }
  return { frame };
});
```

`api` provides the canvas context, theme-aware colors, slide `params`, pointer position, helpers (`rand`, `lerp`, `ease`, `hexA`, `mix`, `text`…) and a DOM root for SVG/HTML animations. Start from [`animations/_plantilla.js`](animations/_plantilla.js); the full API, recipes and the bundled examples are documented in the `create-animation` skill.

Bundled animations: neural network, bubble sort, LLM-wiki compile/lint, WWII alliances/Eastern Front/D-Day, solar-system formation/orbits/sizes, Moon phases.

> **Security**: animation slides execute JavaScript from the deck. Only open decks you wrote or trust.

---

## AI agents and skills (Claude Code · GitHub Copilot · Codex)

The repository is set up so an AI assistant knows how to use the engine at full power. The knowledge lives **once**, in tool-neutral files, and is exposed to each tool in the format it reads.

```
AGENTS.md                      ← shared guide (Codex, Copilot; Claude via CLAUDE.md)
.agents/
  skills/<skill>/SKILL.md      ← Agent Skills (open standard) — SOURCE OF TRUTH
  agents/<agent>.md            ← neutral agent definitions   — SOURCE OF TRUTH
scripts/sync-agents.mjs        ← generates everything below from the sources
.claude/skills → ../.agents/skills        Claude Code (skills)
.claude/agents/*.md                       Claude Code subagents      (generated)
.github/agents/*.agent.md                 Copilot custom agents      (generated)
.codex/agents/*.toml                      Codex custom agents        (generated)
.github/copilot-instructions.md, instructions/, prompts/   Copilot instructions and prompt files
prompt.en.md                              prompt for any chat LLM    (generated)
```

### Skills (the knowledge)

| Skill | What it does |
|---|---|
| `create-presentation` | Brief → storyline → slide types → deck JSON → validate → preview. Includes the full slide catalog. |
| `create-animation` | Designs and writes looping canvas animations (API, recipes, safe zones, testing). |
| `review-presentation` | QA: validator + in-browser `Slides.audit()` + content, facts and accessibility checklist, with a report format. |
| `theming` | Choosing and creating themes, slide modes, logos, contrast checks. |
| `research-topic` | Verified, sourced fact packs before writing factual decks. |
| `extend-engine` | Safe changes to `index.html`, validator and docs (architecture map, gotchas, checklists). |
| `run-and-export` | Serve, present, export to PDF, publish to GitHub Pages, troubleshooting. |

### Agents (the roles)

| Agent | Role | Edits files |
|---|---|---|
| `presentation-architect` | Turns a topic or document into a finished, validated deck | `data/`, `animations/` |
| `content-researcher` | Verifies facts and returns a fact pack with sources | no |
| `animation-engineer` | Creates and debugs animations | `animations/`, decks |
| `presentation-reviewer` | Independent QA report with prioritized findings | no |
| `engine-developer` | Evolves the engine, validator and docs | `index.html`, `scripts/`, docs |

### Using them

**Claude Code** — run `claude` in the repo. Skills load automatically (or run `/create-presentation`, `/create-animation`, `/review-presentation`…). Delegate to subagents by name:

> *Use the content-researcher agent to gather verified facts about the Apollo program, then the presentation-architect agent to create a 15-slide deck with two animations, and finish with the presentation-reviewer agent.*

**GitHub Copilot** (VS Code and the Copilot coding agent) — skills in `.agents/skills` are discovered automatically; pick a custom agent from the agent picker (`presentation-architect`, …); in VS Code use the prompt files `/new-presentation`, `/new-animation` and `/review-presentation`. Repository and per-path instructions apply automatically.

**Codex** (CLI / IDE) — Codex reads `AGENTS.md` and the skills in `.agents/skills`; mention a skill by name (e.g. *"use the create-presentation skill to…"*) or just describe the task. Project agents are defined in `.codex/agents/*.toml`, e.g. *"Spawn the presentation-reviewer agent on data/sistema-solar.json."*

**Any other chat LLM** — paste [`prompt.en.md`](prompt.en.md) (English) or [`prompt.md`](prompt.md) (Spanish), add your content, and save the JSON it returns into `data/`.

### Tools the agents (and you) can run

| Tool | What it gives you |
|---|---|
| `npm run validate` | Static checks for every deck: unknown types, missing fields, wrong array lengths, bad enums, animation syntax, risky APIs, style warnings. `--json` for machines, `--strict` to fail on warnings. |
| `await Slides.audit()` (browser console) | Rendered checks: render errors, content that overflowed and auto-shrank, broken images, animations that fail. |
| `npm run serve` | Dependency-free static server on port 8765. |
| `npm run sync` / `npm run check` | Regenerate / verify the per-tool agent files. CI runs `check` and `validate` on every push. |

### Changing skills or agents

Edit the **sources** (`.agents/skills/**`, `.agents/agents/*.md`, `scripts/prompt-header.en.md`), then:

```bash
npm run sync      # regenerate Claude, Copilot and Codex files + prompt.en.md
npm run check     # verify; CI fails if the generated files drift
```

Never edit the generated files by hand. On Windows without symlink support run `npm run sync:copy` to copy skills into `.claude/skills`.

To add a skill: create `.agents/skills/<name>/SKILL.md` with `name` (equal to the folder) and `description` frontmatter; keep it focused and put long material in `references/`. To add an agent: create `.agents/agents/<name>.md` with `name`, `description`, `tools` (`read`, `edit`, `search`, `run`, `web` or `inherit`), `sandbox` (`read-only` | `workspace-write`) and `skills`.

---

## Repository structure

```
index.html            the engine (single file)
data/                 decks (JSON)
animations/           full-screen animations (JS)
scripts/              validate-deck, serve, sync-agents
.agents/              skills + agents (sources)
.claude/ .codex/ .github/   generated and tool-specific files, CI
AGENTS.md CLAUDE.md   agent instructions
prompt.md prompt.en.md      chat prompts (ES / EN)
```

## Requirements and notes

- A modern evergreen browser (developed and tested in Chromium). Fonts (Inter, JetBrains Mono), Phosphor Icons and Chart.js load from CDNs; the first load needs internet access.
- Node ≥ 18 only for the optional scripts (server, validator, sync); the engine itself needs no tooling.
- Some built-in UI strings (toasts, tooltips) are still in Spanish; deck content can be in any language.
- This repository does not include a license file yet.
