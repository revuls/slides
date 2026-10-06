/* LLM Wiki — "Compilar una vez, consultar siempre"
   Fase 1 (INGEST): cada fuente entra en el LLM, que crea/actualiza varias páginas del wiki.
   Fase 2 (QUERY): una pregunta recorre el índice y las páginas ya conectadas y devuelve la respuesta.
   Es una función pura del tiempo: ciclo de 14 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, ease, clamp, TAU } = api;
  const CYC = 14;

  // --- wiki: nodos en una elipse (posiciones deterministas) ---
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const CX = 1400, CY = 555, RX = 340, RY = 215;
  const nodes = [{ x: CX, y: CY, hub: true }];
  for (let tries = 0; nodes.length < 14 && tries < 4000; tries++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()), x = CX + Math.cos(a) * r * RX, y = CY + Math.sin(a) * r * RY;
    if (nodes.every(n => Math.hypot(n.x - x, n.y - y) > 120)) nodes.push({ x, y });
  }
  const edges = new Map();
  nodes.forEach((n, i) => {
    const near = nodes.map((m, j) => ({ j, d: Math.hypot(n.x - m.x, n.y - m.y) })).filter(o => o.j !== i).sort((a, b) => a.d - b.d).slice(0, n.hub ? 6 : 2);
    near.forEach(o => edges.set(i < o.j ? i + '-' + o.j : o.j + '-' + i, [Math.min(i, o.j), Math.max(i, o.j)]));
  });

  // --- fuentes y LLM ---
  const DOCS = ['informe.pdf', 'notas.md', 'artículo.html', 'paper.pdf'];
  const dx = 330, dy = k => 440 + k * 92, LLM = { x: 790, y: 600 };
  const ts = k => .7 + k * 1.6;                          // instante en que sale la fuente k
  const groups = k => nodes.map((_, i) => i).filter(i => i > 0 && (i % 4 === k || (i + 1) % 4 === k));
  const arrive = k => ts(k) + .9 + .8;                   // llegada de los pulsos del LLM a las páginas
  const firstDoc = i => (i % 4);
  const reveal = i => i === 0 ? 0 : arrive(firstDoc(i));

  function page(x, y, s, glow, a) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = hexA(C.fg, .08 + glow * .22); ctx.strokeStyle = glow > .05 ? C.brand : hexA(C.fg, .5); ctx.lineWidth = 3;
    if (glow > .05) { ctx.shadowColor = C.brand; ctx.shadowBlur = 36 * glow; }
    ctx.beginPath(); ctx.roundRect(x - 22 * s, y - 28 * s, 44 * s, 56 * s, 8 * s); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = hexA(C.fg, .45); ctx.lineWidth = 3;
    for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(x - 12 * s, y - 12 * s + l * 12 * s); ctx.lineTo(x + 12 * s, y - 12 * s + l * 12 * s); ctx.stroke(); }
    ctx.restore();
  }
  const dot = (x, y, r, col, blur) => { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); };

  function frame(dt, t) {
    const c = api.static ? 12.2 : t % CYC;
    const fade = c > 13.3 ? clamp(1 - (c - 13.3) / .7) : 1;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = fade;

    // nivel de glow de cada nodo (por actualizaciones recientes)
    const glow = nodes.map((_, i) => {
      let g = 0;
      for (let k = 0; k < 4; k++) if (i === 0 || groups(k).includes(i)) { const d = c - arrive(k); if (d > 0 && d < 1.2) g = Math.max(g, 1 - d / 1.2); }
      return g;
    });
    const alpha = nodes.map((_, i) => i === 0 ? 1 : clamp((c - reveal(i)) / .5));

    // aristas del wiki
    ctx.lineWidth = 2.5;
    edges.forEach(([i, j]) => { const a = Math.min(alpha[i], alpha[j]); if (a <= 0) return; ctx.strokeStyle = hexA(C.fg, .32 * a); ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); });
    nodes.forEach((n, i) => { if (alpha[i] > 0) page(n.x, n.y, n.hub ? 2 : 1.4, glow[i], alpha[i]); });
    text('index.md', CX, CY + 98, { size: 28, weight: 600, align: 'center', alpha: .8 });

    // fuentes (inmutables)
    DOCS.forEach((nm, k) => {
      const used = c > ts(k) + .1, x = dx, y = dy(k);
      ctx.fillStyle = hexA(C.fg, used ? .05 : .12); ctx.strokeStyle = hexA(C.fg, used ? .25 : .55); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 120, y - 32, 240, 64, 12); ctx.fill(); ctx.stroke();
      text(nm, x, y, { size: 26, weight: 600, align: 'center', base: 'middle', alpha: used ? .4 : .95 });
    });
    text('Fuentes (raw/)', dx, 830, { size: 28, weight: 700, align: 'center', alpha: .85 });
    text('solo lectura', dx, 866, { size: 22, weight: 500, align: 'center', alpha: .55 });

    // documento en tránsito + pulsos del LLM
    let pulse = 0;
    for (let k = 0; k < 4; k++) {
      const p = clamp((c - ts(k)) / .9);
      if (p > 0 && p < 1) {
        const e = ease(p), x = dx + 120 + (LLM.x - 75 - dx - 120) * e, y = dy(k) + (LLM.y - dy(k)) * e;
        ctx.save(); ctx.globalAlpha = fade * (1 - p * .3); ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.roundRect(x - 34, y - 22, 68, 44, 8); ctx.fill(); ctx.restore();
      }
      const q = clamp((c - (ts(k) + .9)) / .8);
      if (q > 0 && q < 1) pulse = Math.max(pulse, 1 - q * .5);
      if (q > 0 && q < 1) groups(k).forEach(i => {
        const n = nodes[i], x = LLM.x + 75 + (n.x - LLM.x - 75) * q, y = LLM.y + (n.y - LLM.y) * q;
        dot(x, y, 8, C.brand, 22);
      });
    }
    // LLM
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 40 * pulse;
    ctx.fillStyle = hexA(C.brand, .15 + pulse * .5); ctx.strokeStyle = C.brand; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(LLM.x - 75, LLM.y - 75, 150, 150, 28); ctx.fill(); ctx.stroke(); ctx.restore();
    text('LLM', LLM.x, LLM.y, { size: 46, weight: 800, align: 'center', base: 'middle' });
    text('compila', LLM.x, LLM.y + 118, { size: 26, weight: 600, align: 'center', alpha: .7 });
    text('Wiki (wiki/ · Markdown)', CX, 855, { size: 30, weight: 700, align: 'center', alpha: .85 });

    // fase 2: consulta
    const Q0 = 7.6, ans = { x: 1560, y: 960 };
    const path = [{ x: 330, y: 960 }, nodes[0], nodes[3], nodes[7], nodes[10], ans];
    const dur = [1.3, .7, .7, .7, 1.2];
    text(c < Q0 ? '1 · INGEST: cada fuente actualiza varias páginas' : '2 · QUERY: la respuesta sale del wiki ya conectado', W - 120, 190, { size: 30, weight: 700, align: 'right', color: C.brand });
    if (c >= Q0 - .5) {
      ctx.fillStyle = hexA(C.fg, .1); ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(330 - 100, 960 - 30, 200, 60, 30); ctx.fill(); ctx.stroke();
      text('Pregunta', 330, 960, { size: 28, weight: 700, align: 'center', base: 'middle' });
    }
    const done = c > Q0 + dur.reduce((a, b) => a + b, 0);
    ctx.save(); ctx.fillStyle = done ? hexA(C.brand, .85) : hexA(C.fg, .08); ctx.strokeStyle = done ? C.brand : hexA(C.fg, .35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(ans.x - 150, ans.y - 38, 300, 76, 20); ctx.fill(); ctx.stroke(); ctx.restore();
    text('Respuesta con citas', ans.x, ans.y, { size: 28, weight: 700, align: 'center', base: 'middle', color: done ? '#ffffff' : C.fg, alpha: done ? 1 : .6 });
    if (c > Q0) {
      let el = c - Q0, s = 0;
      for (let k = 0; k < dur.length; k++) {
        const p = clamp(el / dur[k]); const a = path[k], b = path[k + 1];
        const x = a.x + (b.x - a.x) * ease(p), y = a.y + (b.y - a.y) * ease(p);
        ctx.strokeStyle = hexA(C.brand, .55); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
        if (p > 0 && p < 1) dot(x, y, 12, C.brandXl, 30);
        el -= dur[k]; if (el <= 0) break;
      }
    }
    ctx.globalAlpha = 1;
  }
  return { frame };
});
