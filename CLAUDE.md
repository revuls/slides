@AGENTS.md

## Claude Code specifics

- **Skills** live in `.agents/skills/` and are exposed to Claude Code through the `.claude/skills` symlink. Invoke one explicitly with `/create-presentation`, `/create-animation`, `/review-presentation`, `/theming`, `/research-topic`, `/extend-engine` or `/run-and-export`; Claude also loads them automatically from their descriptions.
- **Subagents** are in `.claude/agents/` (generated). Delegate with prompts like *"use the presentation-architect agent to create a deck about …"* or *"have the presentation-reviewer check data/x.json"*.
- You can run the app and take screenshots with the built-in browser: start `npm run serve`, open `http://localhost:8765/?src=data/<deck>.json`, run `await Slides.audit()` in the page and look at the cover, the densest slide and every animation.
- If symlinks are unavailable (Windows without developer mode), run `npm run sync:copy` to copy skills into `.claude/skills`.
- After editing anything under `.agents/`, run `npm run sync` and `npm run check`.
