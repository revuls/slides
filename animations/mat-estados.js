/* Materiales — Estados de la materia y sólidos cristalinos frente a amorfos.
   params.modo: 'temperatura' (por defecto) | 'solidos'.
   'temperatura': arrastra el ratón por la barra inferior (o deja que barra sola) para calentar o enfriar.
   Esquema ilustrativo: la simulación no es cuantitativa. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const MODO = params.modo || 'temperatura';
  let sd = 5; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const BLUE = '#4aa3ff';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const ball = (x, y, r, col) => {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    g.addColorStop(0, mix(col, '#ffffff', .5)); g.addColorStop(1, mix(col, '#000000', .25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  /* ---------------- modo temperatura ---------------- */
  const BX = 940, BY = 250, BW = 840, BH = 560, N = 112, R = 15;
  const parts = [];
  for (let i = 0; i < N; i++) {
    const col = i % 14, row = Math.floor(i / 14);
    parts.push({ hx: BX + 70 + col * 55 + (row % 2) * 27, hy: BY + BH - 60 - row * 50, x: 0, y: 0, vx: 0, vy: 0 });
    parts[i].x = parts[i].hx; parts[i].y = parts[i].hy;
  }
  let T = .05, auto = true, idleT = 0;
  function simulate(dt) {
    const sub = 2, h = dt / sub;
    const solid = 1 - ph(T, .28, .36), gas = ph(T, .62, .72);
    const speed = 30 + 520 * T * T, g = 900 * (1 - gas);
    for (let s = 0; s < sub; s++) {
      for (const p of parts) {
        // muelle hacia su posición de red (sólo en estado sólido)
        p.vx += (p.hx - p.x) * 90 * solid * h; p.vy += (p.hy - p.y) * 90 * solid * h;
        p.vy += g * (1 - solid) * h;
        // agitación térmica
        const a = rnd() * TAU, k = speed * 9 * h * (solid ? .45 : 1);
        p.vx += Math.cos(a) * k; p.vy += Math.sin(a) * k;
        const d = Math.pow(.992, 60 * h) * (solid ? .9 : 1);
        p.vx *= d; p.vy *= d;
        p.x += p.vx * h; p.y += p.vy * h;
        if (p.x < BX + R) { p.x = BX + R; p.vx = Math.abs(p.vx); } if (p.x > BX + BW - R) { p.x = BX + BW - R; p.vx = -Math.abs(p.vx); }
        if (p.y < BY + R) { p.y = BY + R; p.vy = Math.abs(p.vy); } if (p.y > BY + BH - R) { p.y = BY + BH - R; p.vy = -Math.abs(p.vy); }
      }
      if (solid < 1) for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = parts[i], b = parts[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 3600 && d2 > .01) {
          const d = Math.sqrt(d2), f = d < 38 ? (38 - d) * 26 : -(d - 38) * 3 * (1 - gas);
          const fx = dx / d * f * h * (1 - solid), fy = dy / d * f * h * (1 - solid);
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
    }
  }

  function drawTemp(t, dt) {
    const bar = { x: 960, y: 900, w: 800, h: 28 };
    const hover = pointer.x > bar.x - 20 && pointer.x < bar.x + bar.w + 20 && pointer.y > bar.y - 50 && pointer.y < bar.y + 70;
    if (hover) { T = clamp((pointer.x - bar.x) / bar.w); idleT = 0; auto = false; }
    else { idleT += dt; if (idleT > 2) auto = true; }
    if (auto) { const c = api.static ? 12 : t; T = .5 - .5 * Math.cos(c / 20 * TAU - .8); T = clamp(T * 1.08 - .02); }
    simulate(Math.min(dt, 1 / 30));
    // recipiente
    ctx.fillStyle = hexA(C.fg, .05); ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(BX, BY, BW, BH, 18); ctx.fill(); ctx.stroke();
    const col = mix(BLUE, C.brand, ph(T, .1, .95));
    for (const p of parts) ball(p.x, p.y, R, col);
    // barra de temperatura
    const g = ctx.createLinearGradient(bar.x, 0, bar.x + bar.w, 0); g.addColorStop(0, BLUE); g.addColorStop(1, C.brand);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(bar.x, bar.y, bar.w, bar.h, 14); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = hexA('#000000', .4); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bar.x + T * bar.w, bar.y + bar.h / 2, 22, 0, TAU); ctx.fill(); ctx.stroke();
    text('Temperatura', bar.x, bar.y - 24, { size: 26, weight: 700, alpha: .8 });
    text('Arrastra por la barra', bar.x + bar.w, bar.y - 24, { size: 22, weight: 600, align: 'right', alpha: .5 });
    const st = T < .3 ? 'Sólido' : T < .66 ? 'Líquido' : 'Gas';
    const desc = T < .3 ? 'Partículas muy próximas, vibran en posiciones fijas' : T < .66 ? 'Próximas pero sin orden fijo: fluyen' : 'Se mueven libres, ocupan todo el volumen';
    text(st, 120, 760, { size: 78, weight: 800, color: C.brand });
    text(desc, 120, 820, { size: 28, weight: 600, alpha: .85 });
    text('Presión y tiempo también influyen en la fase', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }

  /* ---------------- modo sólidos ---------------- */
  const COLS = 7, ROWS = 8, SP = 54, PW = 400, PH = 520;
  const pan = [{ x: 940, label: 'Sólido cristalino', sub: 'Enfriamiento lento · átomos ordenados' }, { x: 1380, label: 'Sólido amorfo', sub: 'Enfriamiento rápido · sin orden' }];
  const sol = [];
  for (let k = 0; k < 2; k++) {
    const arr = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      arr.push({ lx: (PW - (COLS - 1) * SP) / 2 + i * SP + (j % 2) * SP / 2 - SP / 4, ly: 50 + j * SP * .86 + 24, ph: rnd() * TAU, ph2: rnd() * TAU, s: .7 + rnd() * .8, rx: 30 + rnd() * (PW - 60), ry: 30 + rnd() * (PH - 60) });
    }
    sol.push(arr);
  }
  const wander = (p, t) => [clamp(p.rx + Math.sin(t * p.s * 1.3 + p.ph) * 55 + Math.sin(t * .9 + p.ph2) * 25, 22, PW - 22), clamp(p.ry + Math.cos(t * p.s * 1.1 + p.ph2) * 55 + Math.cos(t * .7 + p.ph) * 25, 22, PH - 22)];
  const freezeT = 3.6;

  function drawSolid(c) {
    const fade = c > 15.4 ? clamp(1 - (c - 15.4) / .6) : 1;
    ctx.globalAlpha = fade;
    pan.forEach((P, k) => {
      const y0 = 300;
      ctx.fillStyle = hexA(C.fg, .05); ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(P.x, y0, PW, PH, 18); ctx.fill(); ctx.stroke();
      const cool = k === 0 ? ease(ph(c, 3, 11)) : ph(c, 3, freezeT);
      const pts = sol[k].map(p => {
        let [wx, wy] = wander(p, c < freezeT ? c : (k ? freezeT : c));
        if (k === 1 && c >= freezeT) { wx += Math.sin(c * 9 + p.ph) * 1.5; wy += Math.cos(c * 8 + p.ph2) * 1.5; }
        if (k === 0) { const e = cool; wx = lerp(wx, p.lx, e); wy = lerp(wy, p.ly, e); if (e >= 1) { wx += Math.sin(c * 8 + p.ph) * 2; wy += Math.cos(c * 7 + p.ph2) * 2; } }
        return [P.x + wx, y0 + wy];
      });
      const solidK = k === 0 ? cool >= 1 : c >= freezeT + .3;
      if (solidK) {
        ctx.strokeStyle = hexA(C.brand, .5); ctx.lineWidth = 3;
        for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
          const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
          if (d < SP * 1.18) { ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke(); }
        }
      }
      const colr = mix(BLUE, C.brand, solidK ? 0 : .6);
      pts.forEach(q => ball(q[0], q[1], 17, solidK ? C.brand : colr));
      text(P.label, P.x + PW / 2, y0 + PH + 52, { size: 32, weight: 800, align: 'center', color: C.brand });
      text(P.sub, P.x + PW / 2, y0 + PH + 90, { size: 24, weight: 600, align: 'center', alpha: .8 });
    });
    const msg = c < 3 ? ['Líquido: las partículas', 'se mueven sin orden fijo'] : c < 11 ? ['Enfriamos: a la izquierda, despacio;', 'a la derecha, de golpe'] : ['Cristalino: orden regular.', 'Amorfo: sin orden.'];
    msg.forEach((m, i) => text(m, 120, 740 + i * 52, { size: 38, weight: 800, color: C.brand }));
    ctx.globalAlpha = 1;
    ctx.fillStyle = hexA(C.fg, .12); ctx.fillRect(940, 210, 880, 8);
    ctx.fillStyle = C.brand; ctx.fillRect(940, 210, 880 * clamp(c / 15.4), 8);
    text(c < 3 ? 'LÍQUIDO' : 'ENFRIANDO', 940, 190, { size: 22, weight: 800, alpha: .7 });
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    if (MODO === 'solidos') drawSolid(api.static ? 14 : t % 16); else drawTemp(t, dt);
  }
  return { frame };
});
