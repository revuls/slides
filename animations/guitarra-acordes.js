/* Guitarra — Diagramas de acordes abiertos y cómo se mueven los dedos de uno a otro.
   params.chords: lista de acordes (Em, Am, C, G, D, E, A, Dm). params.mode: 'shapes' (muestra cada posición)
   o 'progression' (cuenta 4 tiempos por acorde y rasguea en cada tiempo). params.bpm (por defecto 60).
   Digitaciones habituales para principiantes (Sol con 2-1-3). Dedos: 1 índice, 2 medio, 3 anular, 4 meñique.
   Sonido: cada acorde se rasguea hacia abajo (de la 6ª a la 1ª, sin las cuerdas marcadas con X).
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp, ease } = api;
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2;
  // s = cuerda (6 grave … 1 aguda), f = traste, d = dedo
  const LIB = {
    Em: { es: 'Mim', name: 'Mi menor', fx: [[5, 2, 2], [4, 2, 3]], mute: [] },
    Am: { es: 'Lam', name: 'La menor', fx: [[4, 2, 2], [3, 2, 3], [2, 1, 1]], mute: [6] },
    C: { es: 'Do', name: 'Do mayor', fx: [[5, 3, 3], [4, 2, 2], [2, 1, 1]], mute: [6] },
    G: { es: 'Sol', name: 'Sol mayor', fx: [[6, 3, 2], [5, 2, 1], [1, 3, 3]], mute: [] },
    D: { es: 'Re', name: 'Re mayor', fx: [[3, 2, 1], [2, 3, 3], [1, 2, 2]], mute: [6, 5] },
    E: { es: 'Mi', name: 'Mi mayor', fx: [[5, 2, 2], [4, 2, 3], [3, 1, 1]], mute: [] },
    A: { es: 'La', name: 'La mayor', fx: [[4, 2, 1], [3, 2, 2], [2, 2, 3]], mute: [6] },
    Dm: { es: 'Rem', name: 'Re menor', fx: [[3, 2, 2], [2, 3, 3], [1, 1, 1]], mute: [6, 5] }
  };
  const SEQ = (params.chords || ['Em', 'Am', 'C', 'G', 'D']).filter(k => LIB[k]);
  const PROG = params.mode === 'progression', BPM = params.bpm ?? 60, BEAT = 60 / BPM;
  const T = PROG ? 4 * BEAT : 4, MOVE = .6, N = SEQ.length, CYC = N * T + (PROG ? 0 : .6);
  const FING = ['', 'índice', 'medio', 'anular', 'meñique'];
  // diagrama (vertical, 6ª a la izquierda, cejuela arriba)
  const DX = 1060, DS = 92, NY = 360, FS = 112, NFR = 4;
  const sx = s => DX + (6 - s) * DS, fy = f => NY + (f - .5) * FS;
  const SN = { 6: 'Mi', 5: 'La', 4: 'Re', 3: 'Sol', 2: 'Si', 1: 'Mi' };
  const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  // sonido: dispara eventos cuando el tiempo del bucle cruza un instante (también al dar la vuelta)
  let pc = -1e-3;
  const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;
  const OPEN = { 6: 82.41, 5: 110, 4: 146.83, 3: 196, 2: 246.94, 1: 329.63 };
  const freqs = ch => [6, 5, 4, 3, 2, 1].filter(s => !ch.mute.includes(s)).map(s => { const q = ch.fx.find(x => x[0] === s); return OPEN[s] * Math.pow(2, (q ? q[1] : 0) / 12); });
  const same = (a, b) => a.fx.filter(([s, f, d]) => b.fx.some(q => q[0] === s && q[1] === f && q[2] === d)).map(q => q[2]);

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? (PROG ? 1.5 * T + .2 : 2 * T + 2)) : t % CYC;
    const fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : c < .4 ? clamp(c / .4) : 1;
    const k = Math.min(N - 1, Math.floor(c / T)), lc = c - k * T;
    const cur = LIB[SEQ[k]], nxt = LIB[SEQ[(k + 1) % N]];
    const wrap = k === N - 1 && !PROG;                      // en modo formas no se vuelve al primero
    const mv = wrap ? 0 : ease(clamp((lc - (T - MOVE)) / MOVE));
    const stay = same(cur, nxt);
    // rasgueo: en modo progresión, uno por tiempo; en formas, uno a los 0,9 s
    const strumT = PROG ? lc % BEAT : lc - .9, ring = strumT >= 0 ? Math.exp(-2.4 * strumT) : 0;
    const beat = Math.floor(lc / BEAT);
    SEQ.forEach((key, i) => {
      if (PROG) { for (let b = 0; b < 4; b++) if (cross(c, i * T + b * BEAT + .02)) api.sound.strum(freqs(LIB[key]), { gain: b ? .28 : .36, decay: 2.2, bright: .5 }); }
      else if (cross(c, i * T + .9)) api.sound.strum(freqs(LIB[key]), { gain: .36, decay: 3, bright: .5, spread: .03 });
    });
    pc = c;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round';

    // ---- diagrama ----
    ctx.fillStyle = hexA(C.fg, .05); ctx.fillRect(sx(6) - 40, NY, DS * 5 + 80, FS * NFR);
    ctx.fillStyle = hexA(C.fg, .9); ctx.fillRect(sx(6) - 6, NY - 12, DS * 5 + 12, 14);
    for (let f = 1; f <= NFR; f++) { ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 4; line(sx(6), NY + f * FS, sx(1), NY + f * FS); text(String(f), sx(6) - 62, fy(f) + 9, { size: 24, weight: 700, align: 'center', alpha: .5 }); }
    for (let s = 6; s >= 1; s--) {
      const muted = cur.mute.includes(s), x = sx(s), amp = muted ? 0 : 7 * ring;
      ctx.strokeStyle = muted ? hexA(C.fg, .25) : hexA(C.fg, .75); ctx.lineWidth = 2 + s * .6;
      if (muted) ctx.setLineDash([10, 12]);
      ctx.beginPath();
      for (let j = 0; j <= 24; j++) { const u = j / 24, y = NY + FS * NFR * u, xx = x + amp * Math.sin(Math.PI * u) * Math.sin(strumT * 45); j ? ctx.lineTo(xx, y) : ctx.moveTo(xx, y); }
      ctx.stroke(); ctx.setLineDash([]);
      text(SN[s], x, NY + FS * NFR + 44, { size: 22, weight: 600, align: 'center', alpha: .55 });
      // X / O sobre la cejuela
      const blend = mv > .5 ? nxt : cur, op = !blend.mute.includes(s) && !blend.fx.some(q => q[0] === s);
      if (blend.mute.includes(s)) { ctx.strokeStyle = hexA(C.fg, .85); ctx.lineWidth = 5; line(x - 14, NY - 62, x + 14, NY - 34); line(x + 14, NY - 62, x - 14, NY - 34); }
      else if (op) { ctx.strokeStyle = C.brand; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, NY - 48, 15, 0, TAU); ctx.stroke(); }
    }
    // dedos: cada dedo viaja de su posición en este acorde a la del siguiente
    for (let d = 1; d <= 4; d++) {
      const a = cur.fx.find(q => q[2] === d), b = wrap ? null : nxt.fx.find(q => q[2] === d);
      if (!a && !b) continue;
      let x, y, al = 1;
      if (a && b) { x = sx(a[0]) + (sx(b[0]) - sx(a[0])) * mv; y = fy(a[1]) + (fy(b[1]) - fy(a[1])) * mv; }
      else if (a) { x = sx(a[0]); y = fy(a[1]); al = 1 - mv; }
      else { x = sx(b[0]); y = fy(b[1]); al = mv; }
      if (al <= 0) continue;
      ctx.globalAlpha = fade * al;
      const held = stay.includes(d) && lc > T - MOVE - .9;
      if (held) { ctx.strokeStyle = hexA(C.brand, .5 + .4 * Math.sin(lc * 8)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 50, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(x, y, 38, 0, TAU); ctx.fill();
      text(String(d), x, y + 2, { size: 36, weight: 800, align: 'center', base: 'middle', color: '#ffffff' });
      ctx.globalAlpha = fade;
    }
    // nombre del acorde
    const si = mv > .5 ? (k + 1) % N : k, nameA = LIB[SEQ[si]];     // acorde mostrado (cambia a mitad del movimiento)
    text(nameA.es, 1730, 520, { size: 130, weight: 800, align: 'center', color: C.brand });
    text(SEQ[si], 1730, 590, { size: 46, weight: 700, align: 'center', alpha: .8 });
    text(nameA.name, 1730, 640, { size: 26, weight: 600, align: 'center', alpha: .6 });

    // ---- panel izquierdo ----
    if (!PROG) {
      text('Dónde va cada dedo', 120, 450, { size: 30, weight: 800, color: C.brand });
      [...nameA.fx].sort((p, q) => p[2] - q[2]).forEach(([s, f, d], i) => {
        const y = 516 + i * 62;
        ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(140, y - 9, 22, 0, TAU); ctx.fill();
        text(String(d), 140, y - 7, { size: 26, weight: 800, align: 'center', base: 'middle', color: '#ffffff' });
        text(`${FING[d]} → ${s}ª cuerda, traste ${f}`, 182, y, { size: 28, weight: 600 });
      });
      text('X = no la toques · O = suena al aire', 120, 740, { size: 26, weight: 600, alpha: .75 });
      text('Números: 1 índice · 2 medio · 3 anular · 4 meñique', 120, 784, { size: 24, weight: 600, alpha: .6 });
    } else {
      text('Cuenta 4 tiempos y cambia', 120, 450, { size: 30, weight: 800, color: C.brand });
      for (let b = 0; b < 4; b++) {
        const x = 170 + b * 140, y = 560, on = b === beat, p = on ? Math.exp(-5 * (lc % BEAT)) : 0;
        ctx.fillStyle = on ? C.brand : hexA(C.fg, .1); ctx.beginPath(); ctx.arc(x, y, 48 + 8 * p, 0, TAU); ctx.fill();
        text(String(b + 1), x, y + 2, { size: 44, weight: 800, align: 'center', base: 'middle', color: on ? '#ffffff' : C.fg, alpha: on ? 1 : .6 });
        text('↓', x, y + 100, { size: 34, weight: 800, align: 'center', color: C.brand, alpha: on ? 1 : .35 });
      }
      text(`${BPM} pulsaciones por minuto · un rasgueo hacia abajo por tiempo`, 120, 720, { size: 24, weight: 600, alpha: .7 });
      const tip = lc > T - BEAT ? 'Último tiempo: los dedos ya viajan al siguiente acorde' : 'Mira el acorde siguiente antes de que llegue';
      text(tip, 120, 790, { size: 28, weight: 700, color: lc > T - BEAT ? C.brand : C.fg, alpha: lc > T - BEAT ? 1 : .8 });
    }
    if (stay.length && lc > T - MOVE - .9 && !wrap) {
      const ds = stay.sort((p, q) => p - q);
      text(ds.length > 1 ? `Los dedos ${ds.join(' y ')} no se mueven: úsalos de guía` : `El dedo ${ds[0]} no se mueve: úsalo de guía`, 120, 840, { size: 28, weight: 800, color: C.brand });
    }

    // ---- secuencia ----
    const pw = 150, gap = 40, tw = N * pw + (N - 1) * gap, x0 = W / 2 - tw / 2;
    SEQ.forEach((key, i) => {
      const x = x0 + i * (pw + gap), on = i === si;
      ctx.fillStyle = on ? C.brand : hexA(C.fg, .08); ctx.beginPath(); ctx.roundRect(x, 912, pw, 56, 28); ctx.fill();
      text(LIB[key].es, x + pw / 2, 941, { size: 28, weight: 800, align: 'center', base: 'middle', color: on ? '#ffffff' : C.fg, alpha: on ? 1 : .65 });
      if (i < N - 1 || PROG) text(i < N - 1 ? '→' : '↺', x + pw + gap / 2, 941, { size: 26, weight: 800, align: 'center', base: 'middle', alpha: .5 });
    });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
