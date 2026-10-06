---
applyTo: "animations/**/*.js"
description: Rules for full-screen canvas animations
---
- Wrap everything in `registerAnimation(function (api) { … });` and `return { frame };` where `frame(dt, t)` draws one frame on a 1920×1080 canvas.
- Use only `api.colors` for theme colors; `hexA(color, alpha)` works with hex colors only.
- Make the scene a pure function of time (`c = api.static ? X : t % CYC`), fade at the end of the loop, seed any randomness.
- No network, `eval`, storage or DOM access outside `api.root`; keep < ~300 objects per frame; labels ≥ 22 px.
- Respect the safe zones (title card top-left, logo top-right, footer at the bottom).
- Use the `create-animation` skill (API, recipes, examples) and start from `animations/_plantilla.js`.
