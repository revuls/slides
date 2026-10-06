---
description: Create a complete, validated presentation deck (data/*.json) from a topic or document
agent: agent
---
Use the `create-presentation` skill (and `research-topic` if facts matter, `theming` for the theme, `create-animation` for custom motion) to create a presentation.

Topic / source material: ${input:topic:What is the presentation about?}
Audience and duration: ${input:audience:Who is it for and how long (minutes)?}
Language: ${input:language:Slide language (e.g. English, Spanish)}

Write `data/<kebab-name>.json`, validate it with `node scripts/validate-deck.mjs`, preview it, and summarize the result and any caveats.
