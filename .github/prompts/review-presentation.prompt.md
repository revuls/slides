---
description: Review a presentation deck and report prioritized findings
agent: agent
---
Use the `review-presentation` skill on `${input:deck:data/<deck>.json}`.

Run the validator, audit the rendered deck if you can open a browser (`await Slides.audit()`), spot-check facts, and return the verdict plus Blockers / Major / Minor / What works well. Do not edit files unless asked.
