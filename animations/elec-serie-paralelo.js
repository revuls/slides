/* Electricidad — Circuitos en serie y en paralelo (12 V).
   Serie: R1 = 4 Ω y R2 = 8 Ω → Rt = 12 Ω, I = 1 A, tensiones 4 V + 8 V.
   Paralelo: R1 = 6 Ω y R2 = 12 Ω → Rt = 4 Ω, I = 3 A = 2 A + 1 A, 12 V en cada rama.
   Al final se «quita» el segundo receptor: en serie se corta todo; en paralelo el otro sigue.
   La velocidad de los electrones es proporcional a la intensidad de cada tramo. Esquema didáctico.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const BLUE = '#4aa3ff', RED = '#ff6b6b';
  const CYC = 16, K = 100, SP = 48;
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const wire = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
  const zig = (x0, y0, x1, y1, amp, col) => {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, pts = [[x0, y0]];
    for (let i = 0; i < 6; i++) { const f = (i + .5) / 6, s = i % 2 ? amp : -amp; pts.push([x0 + dx * f + nx * s, y0 + dy * f + ny * s]); }
    pts.push([x1, y1]); ctx.strokeStyle = col; ctx.lineWidth = 9; wire(pts);
  };
  const dot = (x, y) => { ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x + 3.5, y); ctx.stroke(); };
  // recorrido de puntos sobre una polilínea (abierta o cerrada)
  function path(pts, closed) {
    const P = closed ? [...pts, pts[0]] : pts, cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const len = cum[cum.length - 1];
    return { len, at(d) { d = ((d % len) + len) % len; let i = 1; while (cum[i] < d) i++; const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1]); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; } };
  }
  function flowDots(p, off, skip) {
    const n = Math.max(1, Math.round(p.len / SP)), sp = p.len / n;
    for (let i = 0; i < n; i++) { const [x, y] = p.at(i * sp + off); if (!skip(x, y)) dot(x, y); }
  }
  const info = (x, y, lines, align) => lines.forEach(([s, col, a], i) => text(s, x, y + i * 34, { size: 27, weight: 700, align: align || 'left', color: col, alpha: a ?? 1 }));

  // ---- SERIE ----
  const SX0 = 230, SX1 = 880, SY0 = 520, SY1 = 850, SYM = 685;
  const sPath = path([[SX0, SY1], [SX1, SY1], [SX1, SY0], [SX0, SY0]], true);
  const SR1 = [340, 450], SR2 = [570, 680];
  // ---- PARALELO ----
  const PXL = 1050, PYT = 520, PYB = 850, PB1 = 1330, PB2 = 1610, PYM = 685;
  const segs = [
    { p: path([[PXL, PYT], [PXL, PYB]]), q: 'main' }, { p: path([[PXL, PYB], [PB1, PYB]]), q: 'main' }, { p: path([[PB1, PYB], [PB2, PYB]]), q: 'b2' },
    { p: path([[PB1, PYB], [PB1, PYT]]), q: 'b1' }, { p: path([[PB2, PYB], [PB2, PYT]]), q: 'b2' }, { p: path([[PB2, PYT], [PB1, PYT]]), q: 'b2' }, { p: path([[PB1, PYT], [PXL, PYT]]), q: 'main' }
  ];
  const offs = segs.map(() => 0); let sOff = 0;

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 12) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const brk = ph(c, 10.2, 10.8) * (1 - ph(c, 14.4, 14.9)) > .5;       // se retira el receptor R2
    const part = c < 5 ? 1 : c < 10 ? 2 : 3;
    const aS = part === 2 ? .4 : 1, aP = part === 1 ? .4 : 1;
    // intensidades
    const iS = brk ? 0 : 1, I = brk ? { main: 2, b1: 2, b2: 0 } : { main: 3, b1: 2, b2: 1 };
    sOff += K * iS * dt; segs.forEach((s, i) => { offs[i] += K * I[s.q] * dt; });
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ================= SERIE =================
    ctx.globalAlpha = fade * aS;
    text('SERIE', (SX0 + SX1) / 2, 440, { size: 34, weight: 800, align: 'center', color: C.brand });
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 8;
    wire([[SX0, SY1], [SX1, SY1], [SX1, SY0], [SR2[1], SY0]]); wire([[SR2[0], SY0], [SR1[1], SY0]]); wire([[SR1[0], SY0], [SX0, SY0], [SX0, SYM - 40]]); wire([[SX0, SYM + 40], [SX0, SY1]]);
    wire([[SX0, SYM - 40], [SX0, SYM - 24]]); wire([[SX0, SYM + 24], [SX0, SYM + 40]]);
    ctx.strokeStyle = C.fg; ctx.lineWidth = 10; wire([[SX0 - 40, SYM - 24], [SX0 + 40, SYM - 24]]); ctx.lineWidth = 14; wire([[SX0 - 22, SYM + 24], [SX0 + 22, SYM + 24]]);
    text('12 V', SX0 - 58, SYM + 12, { size: 34, weight: 800, align: 'right', color: C.brand });
    zig(SR1[0], SY0, SR1[1], SY0, 22, C.fg); zig(SR2[0], SY0, SR2[1], SY0, 22, brk ? hexA(C.fg, .35) : C.fg);
    flowDots(sPath, sOff, (x, y) => (x === SX0 && Math.abs(y - SYM) < 44) || (y === SY0 && ((x > SR1[0] - 4 && x < SR1[1] + 4) || (x > SR2[0] - 4 && x < SR2[1] + 4))));
    info((SR1[0] + SR1[1]) / 2, SY0 + 66, [['R₁ = 4 Ω', C.fg], [brk ? 'V = 0 V' : 'V = 4 V', part === 1 ? C.brand : C.fg], [brk ? 'I = 0 A' : 'I = 1 A', part === 1 ? C.brand : C.fg]], 'center');
    info((SR2[0] + SR2[1]) / 2, SY0 + 66, [['R₂ = 8 Ω', C.fg], [brk ? 'abierto' : 'V = 8 V', brk ? RED : part === 1 ? C.brand : C.fg], [brk ? 'I = 0 A' : 'I = 1 A', part === 1 ? C.brand : C.fg]], 'center');
    if (brk) { const x = (SR2[0] + SR2[1]) / 2; ctx.strokeStyle = RED; ctx.lineWidth = 7; wire([[x - 18, SY0 - 56], [x + 18, SY0 - 20]]); wire([[x + 18, SY0 - 56], [x - 18, SY0 - 20]]); }
    text(brk ? 'Rt: sin camino cerrado' : 'Rt = 4 + 8 = 12 Ω', (SX0 + SX1) / 2, SY1 + 56, { size: 30, weight: 800, align: 'center', color: brk ? RED : C.fg });

    // ================= PARALELO =================
    ctx.globalAlpha = fade * aP;
    text('PARALELO', (PXL + PB2 + 100) / 2 + 30, 440, { size: 34, weight: 800, align: 'center', color: C.brand });
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 8;
    wire([[PXL, PYT], [PB2, PYT]]); wire([[PXL, PYB], [PB2, PYB]]); wire([[PXL, PYT], [PXL, PYM - 40]]); wire([[PXL, PYM + 40], [PXL, PYB]]);
    wire([[PXL, PYM - 40], [PXL, PYM - 24]]); wire([[PXL, PYM + 24], [PXL, PYM + 40]]);
    ctx.strokeStyle = C.fg; ctx.lineWidth = 10; wire([[PXL - 40, PYM - 24], [PXL + 40, PYM - 24]]); ctx.lineWidth = 14; wire([[PXL - 22, PYM + 24], [PXL + 22, PYM + 24]]);
    text('12 V', PXL - 58, PYM + 12, { size: 34, weight: 800, align: 'right', color: C.brand });
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 8; wire([[PB1, PYT], [PB1, PYM - 70]]); wire([[PB1, PYM + 70], [PB1, PYB]]); wire([[PB2, PYT], [PB2, PYM - 70]]); wire([[PB2, PYM + 70], [PB2, PYB]]);
    zig(PB1, PYM - 70, PB1, PYM + 70, 22, C.fg); zig(PB2, PYM - 70, PB2, PYM + 70, 22, brk ? hexA(C.fg, .35) : C.fg);
    ctx.fillStyle = hexA(C.fg, .8); [[PB1, PYT], [PB1, PYB], [PB2, PYT], [PB2, PYB]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill(); });
    segs.forEach((s, i) => { if (I[s.q] > 0) flowDots(s.p, offs[i], (x, y) => (x === PXL && Math.abs(y - PYM) < 44) || ((x === PB1 || x === PB2) && Math.abs(y - PYM) < 74)); });
    info(PB1 + 46, PYM - 34, [['R₁ = 6 Ω', C.fg], ['V = 12 V', part === 2 ? C.brand : C.fg], ['I = 2 A', part === 2 ? C.brand : C.fg]]);
    info(PB2 + 46, PYM - 34, [['R₂ = 12 Ω', C.fg], [brk ? 'abierto' : 'V = 12 V', brk ? RED : part === 2 ? C.brand : C.fg], [brk ? 'I = 0 A' : 'I = 1 A', part === 2 ? C.brand : C.fg]]);
    if (brk) { ctx.strokeStyle = RED; ctx.lineWidth = 7; wire([[PB2 - 18, PYT + 40], [PB2 + 18, PYT + 76]]); wire([[PB2 + 18, PYT + 40], [PB2 - 18, PYT + 76]]); }
    text(brk ? 'I total = 2 A (el otro sigue)' : 'I total = 2 + 1 = 3 A · Rt = 4 Ω', (PXL + PB2) / 2 + 70, PYB + 56, { size: 30, weight: 800, align: 'center', color: C.fg });

    // ================= mensaje =================
    ctx.globalAlpha = fade;
    text(part === 1 ? 'Serie: misma intensidad · la tensión se reparte (4 V + 8 V = 12 V)' : part === 2 ? 'Paralelo: misma tensión · la intensidad se reparte (2 A + 1 A = 3 A)' : 'Si un receptor falla: en serie se corta todo; en paralelo el otro sigue', W / 2, 975, { size: 32, weight: 800, align: 'center', color: part === 3 ? RED : C.brand });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
