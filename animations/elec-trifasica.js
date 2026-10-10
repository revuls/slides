/* Electricidad — Corriente trifásica (230 V entre fase y neutro, ≈ 400 V entre fases).
   Tres tensiones iguales desfasadas 120° (un tercio de ciclo). Su suma es cero en todo instante.
   La tensión entre dos fases es 230 · √3 ≈ 398 V, es decir, ≈ 400 V. La animación va muy ralentizada. Esquema didáctico.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2, AMB = '#ffd54a';
  const COL = ['#ff8a4c', '#4aa3ff', '#5fd08a'], NAME = ['L1', 'L2', 'L3'];
  const CYC = 16, PER = 4;                                         // un ciclo cada 4 s
  const CX = 335, CY = 610, R = 190;                               // diagrama de vectores
  const GX0 = 780, GX1 = 1790, GW = GX1 - GX0, GY = 560, A = 130;  // senoides
  const SY = 840;                                                  // suma
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const line = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
  const val = (k, th) => Math.sin(th - k * TAU / 3);

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 11) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const p = (c % PER) / PER, th = p * TAU, volt = ph(c, 8, 9);
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- vectores ----
    ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = hexA(C.fg, .25); line([[CX - R - 20, CY], [CX + R + 20, CY]]); line([[CX, CY - R - 20], [CX, CY + R + 20]]);
    const tip = k => { const a = th - k * TAU / 3; return [CX + R * Math.cos(a), CY - R * Math.sin(a)]; };
    if (volt > 0) {   // tensión entre fases L1–L2
      const a = tip(0), b = tip(1); ctx.globalAlpha = fade * volt; ctx.strokeStyle = AMB; ctx.lineWidth = 7; line([a, b]);
      ctx.globalAlpha = fade;
    }
    for (let k = 0; k < 3; k++) {
      const [x, y] = tip(k); ctx.strokeStyle = COL[k]; ctx.lineWidth = 8; line([[CX, CY], [x, y]]);
      ctx.save(); ctx.shadowColor = COL[k]; ctx.shadowBlur = 18; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.restore();
      const a = th - k * TAU / 3; text(NAME[k], CX + (R + 42) * Math.cos(a), CY - (R + 42) * Math.sin(a) + 9, { size: 28, weight: 800, align: 'center', color: COL[k] });
    }
    ctx.fillStyle = hexA(C.fg, .9); ctx.beginPath(); ctx.arc(CX, CY, 9, 0, TAU); ctx.fill();
    text('Tres vectores a 120°', CX, CY + R + 96, { size: 28, weight: 800, align: 'center', color: C.brand });
    if (volt > 0) { ctx.globalAlpha = fade * volt; text('Entre dos fases: ≈ 400 V', CX, CY + R + 136, { size: 28, weight: 800, align: 'center', color: AMB }); ctx.globalAlpha = fade; }

    // ---- senoides ----
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; line([[GX0, GY - A - 26], [GX0, GY + A + 26]]); line([[GX0, GY], [GX1 + 20, GY]]);
    for (let k = 0; k <= 3; k++) {
      const x = GX0 + GW * k / 3; ctx.strokeStyle = hexA(C.fg, .14); ctx.lineWidth = 2; line([[x, GY - A], [x, GY + A + 12]]);
      text(k * 120 + '°', x, GY + A + 44, { size: 24, weight: 700, align: 'center', alpha: .75 });
    }
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = hexA(COL[k], .28); ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = GX0 + GW * i / 200, y = GY - A * val(k, i / 200 * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.strokeStyle = COL[k]; ctx.lineWidth = 7; ctx.beginPath(); const n = Math.max(2, Math.round(200 * p));
      for (let i = 0; i <= n; i++) { const f = i / n * p, x = GX0 + GW * f, y = GY - A * val(k, f * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      const mx = GX0 + GW * p, my = GY - A * val(k, th);
      ctx.save(); ctx.shadowColor = COL[k]; ctx.shadowBlur = 16; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 11, 0, TAU); ctx.fill(); ctx.restore();
    }
    NAME.forEach((n, k) => text(n, GX1 - 190 + k * 70, GY - A - 44, { size: 28, weight: 800, color: COL[k] }));
    text('Cada fase: 230 V', GX0 + 20, GY - A - 44, { size: 28, weight: 800, alpha: .9 });

    // ---- suma ----
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 3; line([[GX0, SY], [GX1 + 20, SY]]);
    ctx.strokeStyle = AMB; ctx.lineWidth = 7; ctx.beginPath(); const m = Math.max(2, Math.round(200 * p));
    for (let i = 0; i <= m; i++) { const f = i / m * p, s = val(0, f * TAU) + val(1, f * TAU) + val(2, f * TAU); const x = GX0 + GW * f, y = SY - A * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    text('L1 + L2 + L3 = 0', GX1, SY - 26, { size: 28, weight: 800, align: 'right', color: AMB });

    // ---- mensaje ----
    text(volt > .5 ? '230 V cada fase · ≈ 400 V entre fases (230 · √3)' : 'Tres tensiones iguales, desfasadas un tercio de ciclo', GX0, 950, { size: 34, weight: 800, color: volt > .5 ? AMB : C.brand });
    text(volt > .5 ? 'Con cargas equilibradas, por el neutro no circula corriente' : 'Mientras una baja, otra sube: la potencia llega más constante', GX0, 992, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
