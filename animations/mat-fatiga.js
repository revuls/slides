/* Materiales — Fatiga: tensión que varía con el tiempo y curva S-N (Wöhler) ilustrativa.
   Tres ensayos a distinta amplitud de tensión (≈ 8 s cada uno): con la amplitud alta rompe pronto; por debajo del
   límite de fatiga de un acero, no rompe. Pasa el ratón por la curva S-N para elegir tú la amplitud.
   Curvas cualitativas, no datos medidos. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp } = api;
  const BLUE = '#4aa3ff', GRN = '#5fd08a';
  const TX0 = 980, TX1 = 1780, TY0 = 200, TY1 = 420;        // tensión-tiempo
  const SX0 = 1020, SX1 = 1780, SY0 = 560, SY1 = 900;       // curva S-N
  const LIM = .45;                                          // límite de fatiga relativo (acero)
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const LEVELS = [.88, .62, .38];
  const lgN = s => s > LIM ? 3 + (1 - s) / (1 - LIM) * 3 : Infinity;            // ferrosos: horizontal por debajo del límite
  const lgNn = s => 3 + (1 - s) / (1 - .18) * 5;                                   // no ferrosos: sin límite claro
  const sx = lg => SX0 + (lg - 3) / 5 * (SX1 - SX0), sy = s => SY1 - s * (SY1 - SY0) * 1.0;
  const SEG = 8.5;

  function frame(dt, t) {
    t = Math.max(0, t);
    const inside = pointer.x > SX0 - 30 && pointer.x < SX1 + 30 && pointer.y > SY0 - 30 && pointer.y < SY1 + 20;
    const c = api.static ? 6 : t % (SEG * 3), k = Math.floor(c / SEG), cc = c % SEG;
    let level = LEVELS[k], p = ph(cc, 0.6, 7);
    if (inside) { level = clamp((SY1 - pointer.y) / (SY1 - SY0), .15, .98); p = ((t * .12) % 1); }
    const nf = lgN(level), tot = Math.min(7.4, isFinite(nf) ? nf : 7.4), prog = 3 + p * (7.4 - 3) * 1;
    const breaks = isFinite(nf) && prog >= nf, runout = !isFinite(nf) && p >= .98;
    const lg = Math.min(prog, isFinite(nf) ? nf : 7.4);
    ctx.clearRect(0, 0, W, H);

    // ---- tensión-tiempo ----
    ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(TX0, TY0 - 8); ctx.lineTo(TX0, TY1); ctx.lineTo(TX1, TY1); ctx.stroke();
    const mid = (TY0 + TY1) / 2, amp = level * (TY1 - TY0) * .4;
    text('Tensión, σ', TX0 + 14, TY0 + 8, { size: 26, weight: 700, alpha: .85 }); text('tiempo', TX1, TY1 + 38, { size: 24, weight: 700, align: 'right', alpha: .75 });
    [[mid - amp, 'σmáx.'], [mid, 'σmedia'], [mid + amp, 'σmín.']].forEach(([y, n], i) => { ctx.setLineDash([10, 10]); ctx.strokeStyle = hexA(i === 1 ? C.fg : C.brand, .5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(TX0, y); ctx.lineTo(TX1, y); ctx.stroke(); ctx.setLineDash([]); text(n, TX1 + 6, y + 8, { size: 20, weight: 700, alpha: .75 }); });
    ctx.strokeStyle = breaks ? hexA(C.fg, .25) : C.brand; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
    const ph0 = (breaks ? 0 : t) * 3.2;
    for (let i = 0; i <= 160; i++) { const x = TX0 + 20 + (TX1 - TX0 - 20) * i / 160, y = mid - amp * Math.sin(i / 160 * TAU * 4 - ph0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();

    // ---- S-N ----
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SX0, SY0 - 8); ctx.lineTo(SX0, SY1); ctx.lineTo(SX1, SY1); ctx.stroke();
    text('Tensión, S', SX0 - 14, SY0 - 4, { size: 24, weight: 700, align: 'right', alpha: .8 });
    for (let e = 3; e <= 8; e++) { const x = sx(e); ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, SY1); ctx.lineTo(x, SY1 + 10); ctx.stroke(); text('10' + '³⁴⁵⁶⁷⁸'[e - 3], x, SY1 + 42, { size: 22, weight: 700, align: 'center', alpha: .7 }); }
    text('Número de ciclos, N', SX1, SY1 + 82, { size: 22, weight: 600, align: 'right', alpha: .7 });
    // ferrosos: baja hasta el límite y luego horizontal
    ctx.strokeStyle = BLUE; ctx.lineWidth = 6; ctx.beginPath(); for (let s = .98; s >= LIM; s -= .01) { const x = sx(lgN(s)), y = sy(s); s > .975 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineTo(sx(8), sy(LIM)); ctx.stroke();
    ctx.strokeStyle = GRN; ctx.lineWidth = 6; ctx.beginPath(); for (let s = .98; s >= .2; s -= .01) { const x = sx(lgNn(s)), y = sy(s); s > .975 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    text('Materiales férreos', sx(3.2), sy(.72) - 40, { size: 22, weight: 800, color: BLUE, alpha: .95 }); text('Materiales no férreos', sx(5.7), sy(.62) - 50, { size: 22, weight: 800, color: GRN });
    ctx.setLineDash([8, 10]); ctx.strokeStyle = hexA(BLUE, .7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SX0, sy(LIM)); ctx.lineTo(SX1, sy(LIM)); ctx.stroke(); ctx.setLineDash([]);
    text('Límite de fatiga', SX1, sy(LIM) + 34, { size: 24, weight: 800, align: 'right', color: BLUE });
    // ensayo en curso
    ctx.setLineDash([6, 8]); ctx.strokeStyle = hexA(C.brandXl, .7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SX0, sy(level)); ctx.lineTo(SX1, sy(level)); ctx.stroke(); ctx.setLineDash([]);
    const mx = sx(lg), my = sy(level);
    ctx.save(); ctx.shadowColor = breaks ? '#ff4d4d' : C.brand; ctx.shadowBlur = 24; ctx.fillStyle = breaks ? '#ff4d4d' : '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 13, 0, TAU); ctx.fill(); ctx.restore();
    if (breaks) { ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mx - 18, my - 18); ctx.lineTo(mx + 18, my + 18); ctx.moveTo(mx + 18, my - 18); ctx.lineTo(mx - 18, my + 18); ctx.stroke(); }

    // ---- probeta (izquierda) ----
    const sy0 = 700, crack = breaks ? 1 : clamp((lg - 3) / Math.max(.5, (isFinite(nf) ? nf : 7.4) - 3)) * (isFinite(nf) ? 1 : .25);
    ctx.save(); ctx.translate(500, sy0);
    const g = ctx.createLinearGradient(0, -34, 0, 34); g.addColorStop(0, mix(C.brand, '#ffffff', .4)); g.addColorStop(.5, C.brand); g.addColorStop(1, mix(C.brand, '#000000', .35));
    ctx.fillStyle = '#6b7280'; ctx.fillRect(-300, -52, 70, 104); ctx.fillRect(230, -52, 70, 104);
    ctx.fillStyle = g;
    if (!breaks) { ctx.fillRect(-230, -36, 460, 72); } else { const o = clamp((lg - (nf)) * 3 + .2) * 18 + 8; ctx.fillRect(-230, -36, 230 - o, 72); ctx.fillRect(o, -36, 230 - o, 72); }
    ctx.strokeStyle = hexA('#000000', .35); ctx.lineWidth = 3; const off = ((t * 120) % 46); if (!breaks) for (let x = -230 + off; x < 230; x += 46) { ctx.beginPath(); ctx.moveTo(x, -36); ctx.lineTo(x, 36); ctx.stroke(); }
    if (!breaks && crack > .05) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(4, -36 + 70 * crack * .8); ctx.stroke(); }
    ctx.restore();
    text('Flexión rotativa: la fibra superior pasa de tracción a compresión en cada vuelta', 120, 800, { size: 22, weight: 600, alpha: .75 });
    text(breaks ? 'ROTURA por fatiga' : runout ? 'No rompe (σ bajo el límite)' : 'Ciclos de carga…', 120, 590, { size: 42, weight: 800, color: breaks ? '#ff7a7a' : runout ? GRN : C.brand });
    text(breaks ? 'Con σ alta, rompe en pocos ciclos' : 'Amplitud ' + (level > LIM ? 'alta' : 'baja'), 120, 640, { size: 26, weight: 700, alpha: .9 });
    text('Pasa el ratón por la curva S-N para elegir la amplitud', 120, 990, { size: 22, weight: 600, alpha: .5 });
    text('Puede romper con cargas inferiores a la de rotura', 120, 880, { size: 28, weight: 800, color: C.brand });
    text('incluso por debajo del límite elástico', 120, 920, { size: 24, weight: 600, alpha: .85 });
  }
  return { frame };
});
