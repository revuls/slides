# Copilot instructions

This repository is a JSON-driven presentation engine (`index.html`) with decks in `data/` and canvas animations in `animations/`. **Read [AGENTS.md](../AGENTS.md) first**: it holds the commands, repository map, conventions and definition of done.

Essentials:
- Decks are JSON (`{ meta, slides }`); validate with `npm run validate`. Slide types, fields and limits are in `.agents/skills/create-presentation/references/slide-types.md`.
- Animation slides use `registerAnimation(function (api) { … })` files or inline `code`; see `.agents/skills/create-animation/`.
- Skills are in `.agents/skills/` (read by Copilot automatically); custom agents are in `.github/agents/` (generated: edit `.agents/agents/*.md` and run `npm run sync`).
- Never invent facts, quotes or logos. No new dependencies. Do not edit generated files. Do not commit or push unless asked.
- Reply in the user's language; keep code, docs and comments in English.
