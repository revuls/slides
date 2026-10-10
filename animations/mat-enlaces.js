/* Materiales — Enlaces iónico, covalente y metálico (≈ 24 s en bucle; clic en una pestaña para fijar un enlace).
   Esquemas ilustrativos: tamaños y distancias no están a escala. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const SEG = 8, N = 3, CYC = SEG * N;
  const NAMES = ['Iónico', 'Covalente', 'Metálico'];
  const INFO = [
    ['Transferencia de electrones', 'Sólidos duros y frágiles · alto punto de fusión'],
    ['Los átomos comparten electrones', 'Sólidos duros · malos conductores del calor y la electricidad'],
    ['Electrones libres entre los átomos', 'Buenos conductores · sólidos (salvo el mercurio)']
  ];
  const BLUE = '#4aa3ff';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const sea = Array.from({ length: 46 }, () => ({ x: rnd(), y: rnd(), p: rnd() * TAU, s: .5 + rnd() }));
  const tabs = NAMES.map((n, i) => ({ n, x: 930 + i * 290, y: 150, w: 270, h: 64 }));
  let forced = -1, forcedAt = 0, was = false;

  const atom = (x, y, r, col, label, lab2) => {
    const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
    g.addColorStop(0, mix(col, '#ffffff', .45)); g.addColorStop(1, mix(col, '#000000', .3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (label) text(label, x, y, { size: Math.max(26, r * .6), weight: 800, align: 'center', base: 'middle', color: '#ffffff' });
    if (lab2) text(lab2, x, y + r + 40, { size: 26, weight: 700, align: 'center', alpha: .85 });
  };
  const el = (x, y, r = 8, col = C.brandXl) => {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  };

  function ionic(c) {
    const cx = 1260, cy = 640;
    const ap = ease(ph(c, .6, 2.4));
    const xa = lerp(cx - 330, cx - 175, ap), xb = lerp(cx + 330, cx + 175, ap);
    const tr = ease(ph(c, 2.6, 3.8)), done = tr >= 1;
    const rNa = lerp(92, 66, tr), rCl = lerp(104, 130, tr);
    atom(xa, cy, rNa, mix(C.brand, '#ffffff', .1), done ? 'Na+' : 'Na', 'Sodio');
    atom(xb, cy, rCl, BLUE, done ? 'Cl−' : 'Cl', 'Cloro');
    // electrones de valencia
    if (!done) el(lerp(xa + rNa + 10, xb - rCl - 10, tr), cy - 4 - Math.sin(tr * Math.PI) * 70, 10);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + .3; el(xb + Math.cos(a) * (rCl + 14), cy + Math.sin(a) * (rCl + 14), 7, '#cfe6ff'); }
    if (done) { const a = 7 / 7 * TAU + .3; el(xb + Math.cos(a) * (rCl + 14) + 6, cy + Math.sin(a) * (rCl + 14), 7, C.brandXl); }
    if (done) {
      const k = ph(c, 3.8, 4.6); ctx.globalAlpha = k;
      ctx.strokeStyle = C.fg; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(xa + rNa + 10, cy); ctx.lineTo(xb - rCl - 10, cy); ctx.stroke(); ctx.setLineDash([]);
      text('+  atrae  −', (xa + xb) / 2, cy - 36, { size: 28, weight: 700, align: 'center' }); ctx.globalAlpha = 1;
    }
    // cristal NaCl
    const k2 = ease(ph(c, 5, 6.4));
    if (k2 > 0) {
      ctx.globalAlpha = k2;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x = cx - 160 + i * 80, y = 860 + j * 56 - 30, na = (i + j) % 2 === 0; ctx.fillStyle = na ? C.brand : BLUE; ctx.beginPath(); ctx.arc(x, y, na ? 20 : 26, 0, TAU); ctx.fill(); }
      text('Red cristalina de NaCl', cx + 240, 880, { size: 26, weight: 600, alpha: .85 }); ctx.globalAlpha = 1;
    }
  }

  function covalent(c) {
    const cx = 1260, cy = 660;
    const k = ease(ph(c, .4, 1.8));
    const H3 = [-90, 30, 150].map(d => d * Math.PI / 180);
    const R = lerp(300, 170, k);
    H3.forEach((a, i) => {
      const hx = cx + Math.cos(a) * R, hy = cy + Math.sin(a) * R;
      ctx.strokeStyle = hexA(C.fg, .25 * k); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
      atom(hx, hy, 46, mix(C.brand, '#ffffff', .25), 'H');
      // par compartido
      const mx = (cx + hx) / 2, my = (cy + hy) / 2, nx = -Math.sin(a), ny = Math.cos(a);
      for (let s = 0; s < 2; s++) { const o = Math.sin(c * 3 + i * 2 + s * 3.1) * 14, side = s ? 1 : -1; el(mx + nx * (12 * side) + Math.cos(a) * o, my + ny * (12 * side) + Math.sin(a) * o, 8, k > .6 ? C.brandXl : hexA(C.brandXl, 0)); }
    });
    atom(cx, cy, 96, BLUE, 'N');
    ctx.globalAlpha = ph(c, 2.2, 3);
    text('NH3 · cada enlace es un par de electrones compartido', cx, 920, { size: 28, weight: 700, align: 'center' }); ctx.globalAlpha = 1;
  }

  function metallic(c) {
    const x0 = 960, y0 = 300, cols = 6, rows = 4, dx = 150, dy = 140;
    const field = ph(c, 3, 3.8), drift = field * 120;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = x0 + 60 + i * dx, y = y0 + 150 + j * dy + 40;
      ctx.fillStyle = hexA(C.brand, .9); ctx.beginPath(); ctx.arc(x, y, 38, 0, TAU); ctx.fill();
      text('+', x, y, { size: 36, weight: 800, align: 'center', base: 'middle', color: '#ffffff' });
    }
    const L = x0 + 60 - 70, R = x0 + 60 + (cols - 1) * dx + 70, T = y0 + 190 - 60, B = y0 + 150 + (rows - 1) * dy + 40 + 60;
    sea.forEach(e => {
      const t = c * e.s;
      let x = L + ((e.x * (R - L) + Math.sin(t * 1.3 + e.p) * 60 + drift * (.6 + e.s * .4) * c / 4 + 4000) % (R - L));
      const y = T + (e.y + Math.sin(t * 1.1 + e.p * 2) * .06 + 1) % 1 * (B - T);
      el(x, y, 8, BLUE);
    });
    if (field > 0) {
      ctx.globalAlpha = field; text('Aplicamos tensión → los electrones fluyen: corriente eléctrica', x0 + 60 + (cols - 1) * dx / 2, 900, { size: 28, weight: 700, align: 'center' });
      ctx.strokeStyle = C.brandXl; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 - 20, 870); ctx.lineTo(x0 + 160, 870); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + 160, 870); ctx.lineTo(x0 + 135, 856); ctx.lineTo(x0 + 135, 884); ctx.closePath(); ctx.fillStyle = C.brandXl; ctx.fill(); ctx.globalAlpha = 1;
    }
    text('Iones positivos fijos · mar de electrones libres', x0 + 60 + (cols - 1) * dx / 2, 262, { size: 28, weight: 700, align: 'center', alpha: .9 });
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const down = pointer.down;
    if (down && !was) tabs.forEach((b, i) => { if (pointer.x > b.x && pointer.x < b.x + b.w && pointer.y > b.y && pointer.y < b.y + b.h) { forced = i; forcedAt = t; } });
    was = down;
    if (forced >= 0 && t - forcedAt > 14) forced = -1;
    const base = api.static ? 7 : t % CYC;
    const idx = forced >= 0 ? forced : Math.floor(base / SEG);
    const c = forced >= 0 ? (t - forcedAt) % SEG + (api.static ? 4 : 0) : base % SEG;
    const fade = c > SEG - .6 ? clamp(1 - (c - (SEG - .6)) / .6) : 1;
    ctx.clearRect(0, 0, W, H);
    tabs.forEach((b, i) => {
      const on = i === idx;
      ctx.fillStyle = on ? C.brand : hexA(C.fg, .12); ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 32); ctx.fill();
      text(b.n, b.x + b.w / 2, b.y + b.h / 2, { size: 28, weight: 800, align: 'center', base: 'middle', color: on ? '#ffffff' : C.fg, alpha: on ? 1 : .7 });
    });
    ctx.globalAlpha = fade;
    if (idx === 0) ionic(c); else if (idx === 1) covalent(c); else metallic(c);
    ctx.globalAlpha = 1;
    text(INFO[idx][0], 120, 760, { size: 40, weight: 800, color: C.brand });
    text(INFO[idx][1], 120, 812, { size: 28, weight: 600, alpha: .85 });
    text('Clic en una pestaña para fijar el enlace', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
