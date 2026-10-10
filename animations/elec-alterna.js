/* Electricidad — Corriente alterna monofásica de la red (230 V, 50 Hz).
   Un vector giratorio (el alternador) genera la senoide: la tensión de pico es ≈ 325 V (230 · √2) y el valor eficaz es 230 V.
   El periodo es 20 ms; la animación está muy ralentizada (2 ciclos en 8 s). Esquema didáctico.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const AMB = '#ffd54a', TAU = Math.PI * 2;
  const CYC = 16, SWEEP = 8;                                       // 2 ciclos cada 8 s
  const R = 210, CX = 345, GY = 640;                               // vector giratorio (centro) y eje del tiempo
  const GX0 = 720, GX1 = 1800, GW = GX1 - GX0;                     // 2 ciclos de 20 ms
  const VP = 325, VE = 230, KE = VE / VP;                          // pico y eficaz (en tensión) y su relación en píxeles
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const line = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
  const dash = (pts, col, w) => { ctx.setLineDash([10, 10]); ctx.strokeStyle = col; ctx.lineWidth = w || 3; line(pts); ctx.setLineDash([]); };

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 12.5) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const p = (c % SWEEP) / SWEEP, th = p * 2 * TAU;                 // ángulo recorrido
    const rms = ph(c, 8.4, 9.4);
    const mx = GX0 + GW * p, my = GY - R * Math.sin(th);
    const v = VP * Math.sin(th), ms = p * 40;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- vector giratorio ----
    ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(CX, GY, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2; line([[CX - R - 24, GY], [CX + R + 24, GY]]); line([[CX, GY - R - 24], [CX, GY + R + 24]]);
    const tx = CX + R * Math.cos(th), ty = GY - R * Math.sin(th);
    ctx.strokeStyle = C.brand; ctx.lineWidth = 8; line([[CX, GY], [tx, ty]]);
    ctx.fillStyle = hexA(C.fg, .9); ctx.beginPath(); ctx.arc(CX, GY, 9, 0, TAU); ctx.fill();
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 22; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(tx, ty, 15, 0, TAU); ctx.fill(); ctx.restore();
    text('Vector giratorio', CX, GY + R + 70, { size: 28, weight: 800, align: 'center', color: C.brand });
    text('(el alternador de la central)', CX, GY + R + 104, { size: 24, weight: 600, align: 'center', alpha: .7 });

    // ---- ejes y valores ----
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; line([[GX0, GY - R - 30], [GX0, GY + R + 30]]); line([[GX0, GY], [GX1 + 24, GY]]);
    [-1, 1].forEach(s => dash([[GX0, GY - s * R], [GX1, GY - s * R]], hexA(C.brand, .55)));
    text('+≈325 V (pico)', GX0 - 16, GY - R + 9, { size: 24, weight: 800, align: 'right', color: C.brand });
    text('−≈325 V', GX0 - 16, GY + R + 9, { size: 24, weight: 800, align: 'right', color: C.brand });
    for (let k = 0; k <= 4; k++) {
      const x = GX0 + GW * k / 4; ctx.strokeStyle = hexA(C.fg, .14); ctx.lineWidth = 2; line([[x, GY - R], [x, GY + R + 14]]);
      text(k * 10 + ' ms', x, GY + R + 46, { size: 24, weight: 700, align: 'center', alpha: .75 });
    }
    // periodo
    const bx0 = GX0, bx1 = GX0 + GW / 2, by = GY - R - 44;
    ctx.strokeStyle = AMB; ctx.lineWidth = 4; line([[bx0, by + 12], [bx0, by], [bx1, by], [bx1, by + 12]]);
    text('T = 20 ms · f = 50 Hz', (bx0 + bx1) / 2, by - 16, { size: 28, weight: 800, align: 'center', color: AMB });

    // ---- valor eficaz ----
    if (rms > 0) {
      ctx.globalAlpha = fade * rms;
      [-1, 1].forEach(s => dash([[GX0, GY - s * R * KE], [GX1, GY - s * R * KE]], hexA(AMB, .9), 4));
      text('230 V (valor eficaz)', GX1 + 6, GY - R * KE - 14, { size: 26, weight: 800, align: 'right', color: AMB });
      ctx.globalAlpha = fade;
    }

    // ---- senoide ----
    ctx.strokeStyle = hexA(C.fg, .28); ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 240; i++) { const x = GX0 + GW * i / 240, y = GY - R * Math.sin(i / 240 * 2 * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.strokeStyle = C.brand; ctx.lineWidth = 8; ctx.beginPath(); const n = Math.max(2, Math.round(240 * p));
    for (let i = 0; i <= n; i++) { const f = i / n * p, x = GX0 + GW * f, y = GY - R * Math.sin(f * 2 * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    dash([[tx, ty], [mx, my]], hexA(C.brand, .8), 3);
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 22; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 14, 0, TAU); ctx.fill(); ctx.restore();

    // ---- lectura ----
    const vr = Math.round(v);
    text(`t = ${ms.toFixed(1).replace('.', ',')} ms`, 930, 306, { size: 34, weight: 800, alpha: .9 });
    text(`v = ${vr > 0 ? '+' : vr < 0 ? '−' : ''}${Math.abs(vr)} V`, 1230, 306, { size: 34, weight: 800, color: C.brand });

    // ---- mensaje ----
    text(rms > .5 ? 'Valor eficaz: 230 V ≈ 325 V ÷ √2' : 'La tensión sube, baja, se invierte y se repite', GX0, 950, { size: 34, weight: 800, color: rms > .5 ? AMB : C.brand });
    text(rms > .5 ? 'Calienta lo mismo que 230 V en corriente continua' : '50 ciclos por segundo · 100 cambios de sentido por segundo', GX0, 992, { size: 26, weight: 600, alpha: .85 });
    text('Animación ralentizada', GX1, 992, { size: 22, weight: 600, align: 'right', alpha: .5 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
