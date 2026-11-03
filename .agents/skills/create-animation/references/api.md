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
| `theme` | Active theme name (`classic`, `ocean`…). |
| `sound` | Synthesized audio (see *Sound*). Every call is a silent no-op when muted (`M`), in snapshots, with reduced motion or without Web Audio. |

## Gotchas

- **`text()` ignores `ctx.globalAlpha`**: it sets its own alpha (`opts.alpha`, default 1) inside `save/restore`. To fade or dim text together with the drawing, wrap it: `const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });` (the `elec-*.js` files do).
- **Clamp time**: the first frame can receive a slightly negative `t`; start `frame` with `t = Math.max(0, t)` if you index arrays by `t`.
- **Optional `params.at`**: `const c = api.static ? (params.at ?? 9) : t % CYC;` lets a test deck render any moment of the loop in the PDF/thumbnails (`npm run export:pdf` is the quickest way to inspect one).
- **Stateful motion** (e.g. electrons whose speed changes): accumulate `off += speed * dt` instead of using `t`, so a speed change does not make them jump.

## Sound

Synthesized with Web Audio (no files, no network). One shared context; each animation plays through its own bus, faded out when the slide is left. Browsers only start audio after a user gesture (any key or click, e.g. moving to the slide).

| Call | Description |
|---|---|
| `sound.pluck(freq, { gain=.5, decay=3, bright=.5, delay=0, pan=0 })` | Plucked string (Karplus-Strong), exact pitch. Returns a voice `{ freq(f, glide=.05), stop(fade=.08) }` (glide the pitch while it rings, e.g. a tuning peg). |
| `sound.strum([freqs], { spread=.014, gain=.35, decay, bright, delay })` | Plucks the notes in the given order, `spread` seconds apart (low→high = down-strum). |
| `sound.click({ accent, gain=.35, delay })` | Metronome tick (`accent` = higher pitch for beat 1). |
| `sound.tone(freq, { type='sine', dur=.3, gain=.25, delay })` | Short tone with an envelope. |
| `sound.on` | `true` if sound will actually play. |

Fire sounds on **events**, not every frame: keep the previous loop time and check whether the current one crossed an instant (handles the loop wrap):

```js
let pc = -1e-3;
const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;
function frame(dt, t) {
  const c = api.static ? 9 : t % CYC;
  if (cross(c, 2.5)) api.sound.pluck(220, { decay: 3 });
  pc = c;
  // …draw…
}
```

Standard-tuning open strings (Hz): E2 82.41 · A2 110 · D3 146.83 · G3 196 · B3 246.94 · E4 329.63; each fret multiplies by 2^(1/12). See `animations/guitarra-*.js`.

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
| `text(str, x, y, opts)` | Draw text. `opts`: `size` (32), `weight` (600), `color` (fg), `align` (`left|center|right`), `base` (`alphabetic|middle|top`), `alpha`, `font`. On light slides, a `#rrggbb` color other than white is darkened to 4.5:1 contrast. |
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
