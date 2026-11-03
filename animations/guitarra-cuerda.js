/* Guitarra — Por qué suena una cuerda y qué hace un traste.
   5ª cuerda (La, A2 = 110 Hz). Pisar el traste 5 deja ≈ 75 % de longitud vibrante (Re, D3 ≈ 146,8 Hz);
   el traste 12 la deja en la mitad (La, A3 = 220 Hz: una octava). Trastes en su posición real: x = L · (1 − 2^(−n/12)).
   Sonido: se oye cada pulsación (110, 146,8 y 220 Hz). La vibración está muy ralentizada y exagerada. params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp, ease } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2, CYC = 24, SLOT = 8;
  const X0 = 190, XB = 1740, L = XB - X0;                       // cejuela y puente
  const fx = n => X0 + L * (1 - Math.pow(2, -n / 12));          // posición del traste n
  const NF = 19, NECK_END = fx(NF) + 26;
  const GAP = 38, Y6 = 545, SY = [0, 1, 2, 3, 4, 5].map(i => Y6 + i * GAP);   // índice 0 = 6ª … 5 = 1ª
  const ACT = 1, PLUCK_X = 1610;                                // 5ª cuerda; punto donde se pulsa
  const NAMES = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
  const ST = [
    { fret: 0, f: 110, note: 'La', sci: 'A2', pct: '100 %', m1: 'Al pulsarla, la cuerda vibra entera: su nota «al aire»', m2: 'La caja de resonancia amplifica esa vibración' },
    { fret: 5, f: 146.8, note: 'Re', sci: 'D3', pct: '≈ 75 %', m1: 'Pisar un traste acorta la parte que vibra: nota más aguda', m2: 'Traste 5 de la 5ª cuerda = Re, la misma nota que la 4ª al aire' },
    { fret: 12, f: 220, note: 'La', sci: 'A3', pct: '50 %', m1: 'Traste 12: mitad de longitud, el doble de frecuencia', m2: 'La misma nota, una octava más aguda' }
  ];
  const fingerX = n => n ? fx(n) - (fx(n) - fx(n - 1)) * .32 : X0 - 40;
  // sonido: dispara eventos cuando el tiempo del bucle cruza un instante (también al dar la vuelta)
  let pc = -1e-3;
  const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;
  const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 18.6) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const k = Math.min(ST.length - 1, Math.floor(c / SLOT)), s = ST[k], prev = ST[Math.max(0, k - 1)];
    const lc = c - k * SLOT;                                     // tiempo local del estado
    const mv = k ? ease(clamp(lc / .8)) : 1;                     // el dedo se desplaza al nuevo traste
    const startX = k ? fx(prev.fret) + (fx(s.fret) - fx(prev.fret)) * mv : X0;
    const fingX = fingerX(prev.fret) + (fingerX(s.fret) - fingerX(prev.fret)) * mv;
    const fingA = k === 0 ? 0 : k === 1 ? mv : 1;
    const since = lc - 1.1, amp = since > 0 ? 34 * Math.exp(-.42 * since) : 0;
    const fv = 2.2 * s.f / 110;                                  // frecuencia visual (ralentizada)
    ST.forEach((q, i) => { if (cross(c, i * SLOT + 1.1)) api.sound.pluck(q.f, { decay: 4.5, bright: .55, gain: .7 }); });
    pc = c;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round';

    // ---- mástil, trastes y caja ----
    const top = Y6 - 30, bot = SY[5] + 30;
    ctx.fillStyle = hexA(C.fg, .07); ctx.fillRect(X0, top, NECK_END - X0, bot - top);
    ctx.fillStyle = hexA(C.fg, .07); ctx.strokeStyle = hexA(C.fg, .22); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(1505, (top + bot) / 2, 112, 0, TAU); ctx.fill(); ctx.stroke();
    text('boca', 1505, bot + 46, { size: 20, weight: 600, align: 'center', alpha: .5 });
    for (let n = 1; n <= NF; n++) {
      ctx.strokeStyle = hexA(C.fg, n === s.fret ? .7 : .3); ctx.lineWidth = n === s.fret ? 6 : 4; line(fx(n), top, fx(n), bot);
    }
    const mid = (top + bot) / 2;
    ctx.fillStyle = hexA(C.fg, .22);
    [3, 5, 7, 9, 15, 17].forEach(n => { ctx.beginPath(); ctx.arc((fx(n) + fx(n - 1)) / 2, mid, 9, 0, TAU); ctx.fill(); });
    [-1, 1].forEach(d => { ctx.beginPath(); ctx.arc((fx(12) + fx(11)) / 2, mid + d * 40, 9, 0, TAU); ctx.fill(); });
    ctx.fillStyle = hexA(C.fg, .85); ctx.fillRect(X0 - 14, top - 6, 14, bot - top + 12);
    ctx.fillStyle = hexA(C.fg, .6); ctx.fillRect(XB, top - 16, 22, bot - top + 32);
    text('Cejuela', X0 - 7, bot + 46, { size: 22, weight: 700, align: 'center', alpha: .7 });
    text('Puente', XB + 11, bot + 46, { size: 22, weight: 700, align: 'center', alpha: .7 });
    [1, 3, 5, 7, 9, 12].forEach(n => text(String(n), (fx(n) + fx(n - 1)) / 2, top - 14, { size: 20, weight: n === s.fret ? 800 : 600, align: 'center', alpha: n === s.fret ? 1 : .5, color: n === s.fret ? C.brand : C.fg }));

    // ---- cuerdas ----
    NAMES.forEach((nm, i) => {
      text(nm, X0 - 34, SY[i] + 7, { size: 20, weight: i === ACT ? 800 : 600, align: 'right', alpha: i === ACT ? 1 : .5, color: i === ACT ? C.brand : C.fg });
      if (i === ACT) return;
      ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 6 - i * .7; line(X0, SY[i], XB, SY[i]);
    });
    const y = SY[ACT];
    ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 6; line(X0, y, startX, y);            // tramo que no vibra
    if (amp > .5) {                                                                          // envolvente (onda estacionaria)
      ctx.fillStyle = hexA(C.brand, .13); ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(startX + (XB - startX) * u, y - amp * Math.sin(Math.PI * u)); }
      for (let i = 60; i >= 0; i--) { const u = i / 60; ctx.lineTo(startX + (XB - startX) * u, y + amp * Math.sin(Math.PI * u)); }
      ctx.fill();
    }
    const osc = Math.sin(TAU * fv * Math.max(0, since));
    ctx.strokeStyle = C.brand; ctx.lineWidth = 7; ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const u = i / 80; const x = startX + (XB - startX) * u; const yy = y + amp * Math.sin(Math.PI * u) * osc; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.stroke();
    // pulsación
    if (since > -.5 && since < .6) {
      const a = 1 - Math.abs(since) / .6;
      ctx.strokeStyle = hexA(C.brand, .8 * a); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(PLUCK_X, y, 30 + 30 * clamp(since + .5), 0, TAU); ctx.stroke();
      text('¡pulsa!', PLUCK_X, top - 52, { size: 26, weight: 800, align: 'center', color: C.brand, alpha: a });
    }
    // dedo
    if (fingA > 0) {
      ctx.globalAlpha = fade * fingA;
      ctx.save(); ctx.shadowColor = hexA(C.brand, .6); ctx.shadowBlur = 18;
      ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(fingX, y, 24, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fingX, y, 24, 0, TAU); ctx.stroke();
      text('dedo', fingX, top - 52, { size: 24, weight: 800, align: 'center', color: C.brand });
      ctx.globalAlpha = fade;
    }

    // ---- longitud que vibra ----
    const by = bot + 96;
    ctx.strokeStyle = C.brand; ctx.lineWidth = 4; line(startX, by, XB, by); line(startX, by - 13, startX, by + 13); line(XB, by - 13, XB, by + 13);
    text(`Parte que vibra: ${lc > .8 || !k ? s.pct : '…'}`, (startX + XB) / 2, by + 44, { size: 26, weight: 800, align: 'center', color: C.brand });

    // ---- lectura (arriba a la derecha) ----
    const show = !k || lc > .8 ? s : prev;
    text('5ª cuerda', W - 120, 190, { size: 26, weight: 700, align: 'right', alpha: .75 });
    text(`${String(show.f).replace('.', ',')} Hz`, W - 120, 280, { size: 92, weight: 800, align: 'right', color: C.brand });
    text(`${show.note} · ${show.sci}${show.fret ? ' · traste ' + show.fret : ' · al aire'}`, W - 120, 330, { size: 30, weight: 700, align: 'right' });

    // ---- mensaje ----
    text(s.m1, 120, 950, { size: 34, weight: 800, color: C.brand });
    text(s.m2, 120, 992, { size: 26, weight: 600, alpha: .85 });
    text('Vibración ralentizada y exagerada', W - 120, 992, { size: 22, weight: 600, align: 'right', alpha: .5 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
