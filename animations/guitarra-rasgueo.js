/* Guitarra — Rasgueo en 4/4: la mano oscila sin parar (abajo en cada tiempo, arriba en cada «y»)
   y solo cambia si toca las cuerdas o pasa por el aire. Tres pasos: negras ↓, corcheas ↓↑ y el patrón
   params.pattern (8 posiciones, D = abajo, U = arriba, - = al aire; por defecto 'D-DU-UDU' = ↓ ↓↑ ↑↓↑).
   Sonido: clic de metrónomo en cada tiempo (más agudo en el 1) y acorde de Sol en cada golpe: abajo, las seis cuerdas;
   arriba, solo las agudas. params.bpm (por defecto 70). params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp, mix } = api;
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2;
  const BPM = params.bpm ?? 70, BEAT = 60 / BPM, BAR = 4 * BEAT;
  const PAT = /^[DU-]{8}$/.test(params.pattern || '') ? params.pattern : 'D-DU-UDU';
  const STEPS = [
    { p: 'D-D-D-D-', t: 'Paso 1 · Solo hacia abajo', d: 'Un golpe en cada tiempo: 1, 2, 3, 4' },
    { p: 'DUDUDUDU', t: 'Paso 2 · Abajo y arriba', d: 'Abajo en el número, arriba en la «y»' },
    { p: PAT, t: 'Paso 3 · El patrón', d: 'La mano sigue igual; a veces pasa sin tocar' }
  ];
  const BARS = 2, CYC = STEPS.length * BARS * BAR;
  const COUNT = ['1', 'y', '2', 'y', '3', 'y', '4', 'y'];
  const SOL = [98, 123.47, 146.83, 196, 246.94, 392];                    // acorde de Sol, de la 6ª a la 1ª (Hz)
  // sonido: dispara eventos cuando el tiempo del bucle cruza un instante (también al dar la vuelta)
  let pc = -1e-3;
  const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;

  // cuerdas (6ª arriba: «abajo» = de la 6ª a la 1ª)
  const SX0 = 980, SX1 = 1800, SY0 = 450, SG = 56, PX = 1390;
  const sy = i => SY0 + i * SG;                                         // i = 0 (6ª) … 5 (1ª)
  const PTOP = SY0 - 70, PBOT = sy(5) + 70;
  const arrow = (x, y, down, col, a, hollow) => {
    const h = 30 * (down ? 1 : -1);
    ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x, y + h * .35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 16, y + h * .25); ctx.lineTo(x + 16, y + h * .25); ctx.lineTo(x, y + h); ctx.closePath();
    hollow ? (ctx.lineWidth = 3, ctx.stroke()) : ctx.fill();
    ctx.globalAlpha /= a;
  };

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 4 * BAR + 1.5 * BEAT) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const step = STEPS[Math.min(STEPS.length - 1, Math.floor(c / (BARS * BAR)))];
    const b = c / BEAT;                                                    // tiempo en pulsos
    const e8 = Math.round(b * 2), slot = ((e8 % 8) + 8) % 8, hit = step.p[slot] !== '-';
    // posición de la púa: cruza el centro justo en cada corchea; baja en los tiempos y sube en las «y»
    const pos = .5 + .5 * Math.sin(TAU * b);
    const py = PTOP + (PBOT - PTOP) * pos;
    // último golpe real (para que vibren las cuerdas)
    let last = -1;
    for (let j = Math.floor(b * 2); j >= Math.floor(b * 2) - 8 && j >= 0; j--) if (step.p[j % 8] !== '-' && Math.floor(j / 8 / BARS) === Math.floor(Math.floor(b * 2) / 8 / BARS)) { last = j; break; }
    const since = last < 0 ? 9 : c - last * BEAT / 2;
    const j8 = Math.floor(c / (BEAT / 2));
    if (cross(c, j8 * BEAT / 2)) {
      const sl = j8 % 8, ch = step.p[sl];
      if (sl % 2 === 0) api.sound.click({ accent: sl === 0, gain: sl === 0 ? .3 : .2 });
      if (ch === 'D') api.sound.strum(SOL, { gain: .3, decay: 1.4, bright: .55, spread: .012 });
      if (ch === 'U') api.sound.strum(SOL.slice(2).reverse(), { gain: .22, decay: 1.1, bright: .6, spread: .01 });
    }
    pc = c;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- cuerdas ----
    ctx.fillStyle = hexA(C.fg, .06); ctx.beginPath(); ctx.arc(1230, (sy(0) + sy(5)) / 2, 150, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const amp = (8 - i * .6) * Math.exp(-3 * since);
      ctx.strokeStyle = mix(C.fg, C.brand, clamp((amp - 1.5) / 5)); ctx.globalAlpha = fade * (.55 + .45 * clamp((amp - 1.5) / 5)); ctx.lineWidth = 7 - i * .8; ctx.beginPath();
      for (let j = 0; j <= 40; j++) { const u = j / 40, x = SX0 + (SX1 - SX0) * u, y = sy(i) + amp * Math.sin(Math.PI * u) * Math.sin(since * 50 + i); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.globalAlpha = fade;
    }
    text('6ª', SX0 - 22, sy(0) + 8, { size: 22, weight: 700, align: 'right', alpha: .6 });
    text('1ª', SX0 - 22, sy(5) + 8, { size: 22, weight: 700, align: 'right', alpha: .6 });
    // estela y púa
    const dir = Math.cos(TAU * b) > 0 ? 1 : -1;                            // 1 = bajando
    const g = ctx.createLinearGradient(0, py - dir * 140, 0, py);
    g.addColorStop(0, hexA(C.brand, 0)); g.addColorStop(1, hexA(C.brand, hit ? .5 : .15));
    ctx.strokeStyle = g; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(PX + (hit ? 0 : 70), py - dir * 140); ctx.lineTo(PX + (hit ? 0 : 70), py); ctx.stroke();
    const pxx = PX + (hit ? 0 : 70);
    ctx.globalAlpha = fade * (hit ? 1 : .4);
    ctx.fillStyle = C.brand; ctx.beginPath();
    ctx.moveTo(pxx - 34, py - 30); ctx.quadraticCurveTo(pxx, py - 52, pxx + 34, py - 30); ctx.quadraticCurveTo(pxx + 30, py + 10, pxx, py + 40); ctx.quadraticCurveTo(pxx - 30, py + 10, pxx - 34, py - 30); ctx.fill();
    ctx.globalAlpha = fade;
    text(hit ? (dir > 0 ? 'abajo' : 'arriba') : 'al aire', pxx + 60, py + 10, { size: 26, weight: 800, color: hit ? C.brand : C.fg, alpha: hit ? 1 : .55 });

    // ---- metrónomo (izquierda) ----
    const mx = 300, my = 800, beatP = b % 1;
    ctx.fillStyle = hexA(C.fg, .1); ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mx - 90, my); ctx.lineTo(mx + 90, my); ctx.lineTo(mx + 40, my - 250); ctx.lineTo(mx - 40, my - 250); ctx.closePath(); ctx.fill(); ctx.stroke();
    const sw = .42 * Math.sin(Math.PI * b + Math.PI / 2) * -1;           // un vaivén por tiempo
    const ax = mx + Math.sin(sw) * 220, ay = my - 40 - Math.cos(sw) * 220;
    ctx.strokeStyle = hexA(C.fg, .85); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mx, my - 40); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.fillStyle = C.brand; ctx.fillRect(ax - 18 + (mx - ax) * .25, ay - 12 + (my - 40 - ay) * .25, 36, 24);
    const flash = Math.exp(-7 * beatP);
    ctx.fillStyle = hexA(C.brand, .25 + .75 * flash); ctx.beginPath(); ctx.arc(mx, my + 40, 12 + 8 * flash, 0, TAU); ctx.fill();
    text(`${BPM} bpm`, mx, my + 100, { size: 28, weight: 800, align: 'center', alpha: .8 });
    // cuenta grande
    text(COUNT[slot], 660, 700, { size: 170, weight: 800, align: 'center', color: slot % 2 ? C.fg : C.brand, alpha: slot % 2 ? .7 : 1 });
    text('cuenta en voz alta', 660, 770, { size: 24, weight: 600, align: 'center', alpha: .6 });
    text(step.t, 120, 440, { size: 34, weight: 800, color: C.brand });
    text(step.d, 120, 486, { size: 26, weight: 600, alpha: .85 });

    // ---- compás con el patrón ----
    const cw = 150, x0 = 590;
    ctx.fillStyle = hexA(C.fg, .05); ctx.beginPath(); ctx.roundRect(x0 - 20, 870, cw * 8 + 40, 120, 18); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const x = x0 + cw * (i + .5), on = i === slot, ch = step.p[i];
      if (on) { ctx.fillStyle = hexA(C.brand, .18); ctx.beginPath(); ctx.roundRect(x - cw / 2 + 6, 876, cw - 12, 108, 14); ctx.fill(); }
      text(COUNT[i], x, 906, { size: 28, weight: 800, align: 'center', color: on ? C.brand : C.fg, alpha: i % 2 ? .6 : 1 });
      if (ch === '-') arrow(x, 950, i % 2 === 0, C.fg, .25, true);
      else arrow(x, 950, ch === 'D', C.brand, on ? 1 : .75, false);
    }
    ctx.globalAlpha = 1;
  }
  return { frame };
});
