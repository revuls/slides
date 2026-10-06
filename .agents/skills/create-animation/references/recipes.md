# Recipes

## Looping time and fade

```js
const CYC = 16;
function frame(dt, t) {
  const c = api.static ? 10 : t % CYC;
  const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
  ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
  // …draw using c…
  ctx.globalAlpha = 1;
}
```

## Seeded randomness (identical every loop)

```js
let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
```

## Phases with an easing window

```js
const phase = (c, a, b) => clamp((c - a) / (b - a));      // 0→1 between seconds a and b
const e = ease(phase(c, 3, 8));                            // collapse from 3 s to 8 s
const x = lerp(x0, x1, e);
```

## Pill label

```js
const tag = (txt, x, y, col) => {
  ctx.font = "700 22px 'Inter',sans-serif"; const w = ctx.measureText(txt).width + 36;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 18, w, 36, 18); ctx.fill();
  text(txt, x, y, { size: 22, weight: 700, align: 'center', base: 'middle', color: '#fff' });
};
```

## Glow and spheres

```js
const glow = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(col, .8)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const sphere = (x, y, r, col) => { const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); g.addColorStop(0, mix(col, '#ffffff', .55)); g.addColorStop(1, mix(col, '#000000', .35)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
```

## Moving dot with a fading trail along a segment

```js
const q = clamp(p), x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q, tp = Math.max(0, q - .14);
const g = ctx.createLinearGradient(a.x + (b.x - a.x) * tp, a.y + (b.y - a.y) * tp, x, y);
g.addColorStop(0, hexA(C.brand, 0)); g.addColorStop(1, C.brand);
ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * tp, a.y + (b.y - a.y) * tp); ctx.lineTo(x, y); ctx.stroke();
```

## Pseudo-3D rotation of points

```js
const tilt = .5;                                           // radians of camera tilt
const project = (x, y, z, cx, cy) => [cx + x, cy + y * Math.sin(tilt) - z * Math.cos(tilt)];
```

## Mouse interaction

```js
const dx = pointer.x - p.x, dy = pointer.y - p.y, d = Math.hypot(dx, dy);
if (d < 300 && d > 1) { p.vx += dx / d * 120 * dt; p.vy += dy / d * 120 * dt; }
```

## HUD counter in the top-right corner (safe zone)

```js
text(`${Math.round(value).toLocaleString('es-ES')}`, W - 120, 205, { size: 96, weight: 800, align: 'right', color: C.brand });
text('caption', W - 120, 250, { size: 26, weight: 600, align: 'right', alpha: .8 });
```

## Axis-less line chart that draws itself

Precompute points, then each frame draw the polyline up to progress `p`, add an area gradient under it, and place event labels once `p` passes each event (see `animations/ww2-frente-oriental.js`).

## Pure DOM/SVG animation

Use `api.root` (absolute full-slide `<div>`): create elements in setup, update in `frame`, remove nothing manually (the engine clears `root` on restart). Prefer the canvas for anything with many moving parts.
