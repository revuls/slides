# Animation API

```js
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, rand, TAU, hexA, text } = api;
  // setup…
  function frame(dt, t) { /* draw */ }
  return { frame };               // or { frame, resize() {}, destroy() {} }
});
```

For inline `"code"` use only the body (no wrapper).

## `api` fields

| Field | Description |
|---|---|
| `ctx` | 2D context of the full-slide canvas. Coordinates are always **1920×1080** (the engine scales for you). |
| `W`, `H` | `1920`, `1080`. |
| `canvas` | The `<canvas>` element. |
| `root` | A full-slide `<div>` for DOM/SVG-based animations (instead of the canvas). |
| `colors` | `{ brand, brandL, brandXl, brandD, ink, sec, accent, fg, bg, muted, dark }` — hex strings except `muted` (rgba). They follow the active theme. On dark slides `brand` is the lighter variant so it stays legible. `fg`/`bg` flip with the slide mode. `dark` is true on dark/orange slides. |
| `params` | The slide's `"params"` object (configuration). Always read with defaults: `params.speed ?? 1`. |
| `pointer` | `{ x, y, down }` mouse position in canvas coordinates (`-999` when outside) and button state. |
| `static` | `true` when rendering a snapshot (overview thumbnail, PDF export): the engine calls `frame` ~90–150 times at 30 fps, then freezes. |
| `reduced` | `true` if the OS asks for reduced motion (the engine renders a still frame). |
| `theme` | Active theme name (`ing`, `ocean`…). |

## Utilities

| Function | Description |
|---|---|
| `rand(a?, b?)` | `rand()` ∈ [0,1) · `rand(n)` ∈ [0,n) · `rand(a,b)` ∈ [a,b). Not seeded. |
| `randInt(a, b)` | Integer in [a, b]. |
| `lerp(a, b, t)` · `clamp(v, a=0, b=1)` · `map(v, a1, b1, a2, b2)` | Basic math. |
| `ease(t)` | Ease-in-out cubic, `t` ∈ [0,1]. |
| `TAU`, `PI` | Constants. |
| `hexA(hex, alpha)` | `#rrggbb` → `rgba(...)`. **Hex colors only.** |
| `mix(hexA, hexB, t)` | Blend two hex colors. |
| `text(str, x, y, opts)` | Draw text. `opts`: `size` (32), `weight` (600), `color` (fg), `align` (`left|center|right`), `base` (`alphabetic|middle|top`), `alpha`, `font`. |
| `clear()` | `ctx.clearRect(0, 0, W, H)`. |

## Lifecycle

- `start`: when the slide becomes active (after the transition begins). The code runs from the top: state is fresh each time.
- `frame(dt, t)`: every animation frame while visible; `dt` ≤ 0.05 s.
- `stop`: when leaving the slide, entering the overview, printing, or changing theme/dark mode (the animation restarts with new colors).
- Errors anywhere show a message **inside the slide** and stop the animation; the deck keeps working.

## Static snapshots

During `api.static` the engine simulates frames (`dt = 1/30`) and freezes the canvas. If your scene is a pure function of time, use a fixed moment: `const c = api.static ? 12.5 : t % CYC;`.

## Metadata used by the validator

`registerAnimation(` must appear in `src` files; inline code must compile as a function body; warnings for network/eval/storage usage, hard-coded hex colors without `api.colors`, and a missing `return { frame }`.
