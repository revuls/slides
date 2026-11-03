/* Guitarra — Afinar con un afinador cromático, cuerda a cuerda (afinación estándar Mi La Re Sol Si Mi).
   Frecuencias de referencia con La = 440 Hz: E2 82,4 · A2 110 · D3 146,8 · G3 196 · B3 246,9 · E4 329,6 Hz.
   Sonido: cada cuerda suena desafinada y su tono se desliza hasta la nota al girar la clavija; al final, rasgueo al aire.
   La aguja marca la desviación en cents (1/100 de semitono); las desviaciones de partida son de ejemplo.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp, ease } = api;
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2, OK = '#2fbf71';
  const S = [
    { n: '6ª', note: 'Mi', sci: 'E2', f: 82.41, off: -38 },
    { n: '5ª', note: 'La', sci: 'A2', f: 110, off: 27 },
    { n: '4ª', note: 'Re', sci: 'D3', f: 146.83, off: -22 },
    { n: '3ª', note: 'Sol', sci: 'G3', f: 196, off: -45 },
    { n: '2ª', note: 'Si', sci: 'B3', f: 246.94, off: 33 },
    { n: '1ª', note: 'Mi', sci: 'E4', f: 329.63, off: -15 }
  ];
  const D = 3.6, END = S.length * D, CYC = END + 2.4;
  const GX = 1300, GY = 850, GR = 400, SWEEP = 1.05;               // aguja: ±50 cents = ±60°
  const ang = cents => -Math.PI / 2 + clamp(cents / 50, -1.1, 1.1) * SWEEP;
  // sonido: dispara eventos cuando el tiempo del bucle cruza un instante (también al dar la vuelta)
  let pc = -1e-3;
  const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;
  let voice = null;
  const fmt = (v, d) => v.toFixed(d).replace('.', ',');

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 8.6) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const k = Math.min(S.length - 1, Math.floor(c / D)), lc = c - k * D, s = S[k], done = c >= END;
    // desviación: parte de s.off y converge a 0 con una pequeña oscilación
    const p = ease(clamp((lc - .5) / 1.9));
    const cents = done ? 0 : lc < .5 ? s.off : s.off * (1 - p) + (p < 1 ? Math.sin(lc * 9) * 3 * (1 - p) : 0);
    const tuned = done || lc > 2.45;
    const col = tuned ? OK : C.brand;
    S.forEach((q, i) => {
      if (cross(c, i * D + .35)) { voice?.stop(.2); voice = api.sound.pluck(q.f * Math.pow(2, q.off / 1200), { decay: 4.5, bright: .5, gain: .6 }); }
      if (cross(c, i * D + 2.5)) { voice?.stop(.15); voice = api.sound.pluck(q.f, { decay: 3, bright: .5, gain: .55 }); }
    });
    if (voice && !done && lc > .5 && lc < 2.45) voice.freq(s.f * Math.pow(2, cents / 1200), .04);
    if (cross(c, END + .3)) { voice?.stop(.2); voice = null; api.sound.strum(S.map(q => q.f), { spread: .03, decay: 3.5, gain: .4 }); }
    pc = c;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round';

    // ---- lista de cuerdas (izquierda) ----
    S.forEach((q, i) => {
      const y = 440 + i * 86, cur = !done && i === k, ok = done || i < k || (i === k && tuned);
      ctx.fillStyle = cur ? hexA(C.brand, .16) : hexA(C.fg, .05);
      ctx.strokeStyle = cur ? C.brand : hexA(C.fg, .14); ctx.lineWidth = cur ? 3 : 2;
      ctx.beginPath(); ctx.roundRect(110, y - 34, 600, 68, 16); ctx.fill(); ctx.stroke();
      // la cuerda: más gruesa cuanto más grave; vibra si es la actual
      ctx.strokeStyle = hexA(cur ? C.brand : C.fg, cur ? .9 : .35); ctx.lineWidth = 7 - i;
      ctx.beginPath();
      for (let j = 0; j <= 40; j++) { const u = j / 40, x = 330 + 200 * u; const yy = y + (cur && lc < 3 ? 7 * Math.sin(Math.PI * u) * Math.sin(lc * 40) * Math.exp(-lc) : 0); j ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
      ctx.stroke();
      text(q.n, 140, y + 9, { size: 26, weight: 800, color: cur ? C.brand : C.fg, alpha: cur ? 1 : .7 });
      text(`${q.note} · ${q.sci}`, 196, y + 9, { size: 26, weight: 700, alpha: cur ? 1 : .7 });
      text(`${fmt(q.f, q.f % 1 ? 1 : 0)} Hz`, 690, y + 9, { size: 22, weight: 600, align: 'right', alpha: ok ? .9 : .55 });
      if (ok) { ctx.strokeStyle = OK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(724, y); ctx.lineTo(736, y + 12); ctx.lineTo(758, y - 12); ctx.stroke(); }
    });

    // ---- afinador (derecha) ----
    ctx.lineWidth = 26; ctx.strokeStyle = hexA(C.fg, .1);
    ctx.beginPath(); ctx.arc(GX, GY, GR, ang(-50), ang(50)); ctx.stroke();
    ctx.strokeStyle = hexA(OK, .55); ctx.beginPath(); ctx.arc(GX, GY, GR, ang(-5), ang(5)); ctx.stroke();
    for (let v = -50; v <= 50; v += 10) {
      const a = ang(v), r0 = GR - 34 - (v % 50 ? 0 : 10), r1 = GR - 18;
      ctx.strokeStyle = hexA(C.fg, v ? .45 : .9); ctx.lineWidth = v ? 3 : 5;
      ctx.beginPath(); ctx.moveTo(GX + Math.cos(a) * r0, GY + Math.sin(a) * r0); ctx.lineTo(GX + Math.cos(a) * r1, GY + Math.sin(a) * r1); ctx.stroke();
    }
    text('♭ grave', GX + Math.cos(ang(-50)) * (GR + 40), GY + Math.sin(ang(-50)) * (GR + 40) + 10, { size: 26, weight: 700, align: 'right', alpha: .7 });
    text('aguda ♯', GX + Math.cos(ang(50)) * (GR + 40), GY + Math.sin(ang(50)) * (GR + 40) + 10, { size: 26, weight: 700, align: 'left', alpha: .7 });
    text('0', GX, GY - GR - 30, { size: 26, weight: 800, align: 'center', color: OK });
    // aguja
    const a = ang(cents);
    ctx.save(); ctx.shadowColor = hexA(col, .6); ctx.shadowBlur = 16;
    ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(GX + Math.cos(a) * (GR - 50), GY + Math.sin(a) * (GR - 50)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(GX, GY, 18, 0, TAU); ctx.fill();
    // lectura central
    const shown = done ? S[S.length - 1] : s, hz = shown.f * Math.pow(2, cents / 1200);
    text(done ? 'Afinada' : `${shown.n} · ${shown.note}`, W - 120, 270, { size: 100, weight: 800, align: 'right', color: col });
    text(done ? 'Las seis cuerdas en su nota' : `${fmt(hz, 1)} Hz · ${cents > 0 ? '+' : cents < 0 ? '−' : ''}${Math.abs(Math.round(cents))} cents`, W - 120, 326, { size: 32, weight: 700, align: 'right', alpha: .9 });

    // ---- clavija que gira + indicación ----
    if (!done) {
      const turning = lc > .5 && !tuned, dir = s.off < 0 ? 1 : -1;
      const msg = tuned ? '¡Afinada! Siguiente cuerda' : lc < .5 ? 'Pulsa la cuerda y mira la aguja' : dir > 0 ? 'Demasiado grave: tensa la cuerda' : 'Demasiado aguda: afloja la cuerda';
      text(msg, GX, 945, { size: 34, weight: 800, align: 'center', color: tuned ? OK : C.brand });
      if (turning) {
        const px = GX + 330, py = 935, rot = lc * 5 * dir;
        ctx.strokeStyle = C.brand; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py, 26, rot, rot + 4.6); ctx.stroke();
        const ea = rot + (dir > 0 ? 4.6 : 0), ex = px + Math.cos(ea) * 26, ey = py + Math.sin(ea) * 26;
        ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, TAU); ctx.fill();
      }
    } else {
      text('Repasa las seis: al tensar una, las demás pueden moverse un poco', GX, 945, { size: 30, weight: 800, align: 'center', color: OK });
    }
    text('Desviaciones de ejemplo · referencia La = 440 Hz', 110, 992, { size: 22, weight: 600, alpha: .55 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
