---
name: research-topic
description: Research a topic and produce a verified fact pack (key points, dates, figures, quotes, caveats, sources) to feed a presentation. Use before writing decks on factual subjects such as history, science, technology or business, or whenever numbers and dates must be accurate.
---

# Research a topic

Goal: give the deck author **correct, sourced, presentation-ready facts** — and be explicit about what is uncertain.

## Process

1. **Scope**: audience level, angle, time span, what the deck must prove or explain. Note anything the user supplied (documents, links) as primary sources.
2. **Search broadly, then narrow**: start with authoritative sources (primary documents, official institutions, encyclopedias, peer-reviewed or well-edited outlets), then specifics. For recent or fast-moving subjects, search the web (your training data may be outdated); say the date you checked.
3. **Cross-check every number and date** that will appear on a slide against at least two independent sources when possible. Prefer ranges and `≈` when sources disagree (e.g., casualty figures, populations).
4. **Separate** facts, estimates, interpretations and opinions. Label controversies and competing explanations fairly.
5. **Quotes**: use only short quotations (< 15 words) with attribution and context; mark translations ("translated"). Do not reproduce long passages or song lyrics; paraphrase instead.
6. **Images**: note licenses (public domain, CC) when suggesting visuals; do not assume an image URL shows what you want.
7. **Stop when** the key claims are verified; do not pad with trivia.

## Output: fact pack

Return it in chat (or save to a file only if asked), using this structure:

```markdown
# Fact pack: <topic>
**Checked:** <date> · **Audience:** <…> · **Language:** <…>

## Storyline suggestions (3–5 bullets)
## Key facts
- <fact> — <source short name> (confidence: high/medium/low)
## Timeline
| Date | Event | Source |
## Numbers (ready for slides)
| Figure | Value as it should appear on a slide | Source | Notes (range, estimate, definition) |
## Short quotes
- "<…>" — <person>, <source/year> (translated? yes/no)
## Glossary (terms the audience may not know)
## Caveats & controversies
## Sources
1. <title> — <publisher>, <url>
```

## Rules

- Never fabricate a source, URL, quote or statistic. If you cannot verify something, say so and exclude it or mark it low-confidence.
- Cite sources as markdown links in your final message.
- Keep neutral, factual wording on sensitive subjects (war, genocide, disasters, health, politics).
- Hand the pack to the `create-presentation` skill; flag which figures must carry `≈` or a disclaimer on the slide.
