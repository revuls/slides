/* Guitarra — Cómo se lee una tablatura: un cursor recorre la escala de Do mayor en primera posición
   (Do 5ª/3 · Re 4ª/0 · Mi 4ª/2 · Fa 4ª/3 · Sol 3ª/0 · La 3ª/2 · Si 2ª/0 · Do 2ª/1) y el mástil muestra dónde se pisa.
   Sonido: cada nota suena al pasar el cursor. El mástil se dibuja con la 1ª cuerda arriba, igual que la tablatura. params.at fija el instante de las capturas. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp } = api;
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2;
  const NOTES = [[5, 3, 'Do'], [4, 0, 'Re'], [4, 2, 'Mi'], [4, 3, 'Fa'], [3, 0, 'Sol'], [3, 2, 'La'], [2, 0, 'Si'], [2, 1, 'Do']];
  const OPEN = { 6: 82.41, 5: 110, 4: 146.83, 3: 196, 2: 246.94, 1: 329.63 };            // cuerdas al aire (Hz)
  const SNAME = ['Mi', 'Si', 'Sol', 'Re', 'La', 'Mi'];                  // 1ª … 6ª
  const T0 = 2, STEP = 1.3, LAST = T0 + STEP * (NOTES.length - 1), CYC = 16;
  // mástil (arriba a la derecha)
  const NX = 1010, FW = 180, NFR = 4, FY0 = 200, FG = 46;
  const fy = s => FY0 + (s - 1) * FG, fxm = f => f ? NX + (f - .5) * FW : NX - 34;
  // tablatura (abajo)
  const TX0 = 200, TX1 = 1760, TY0 = 590, TG = 50, NX0 = 370, NST = 190;
  const ty = s => TY0 + (s - 1) * TG, nx = i => NX0 + i * NST;
  // sonido: dispara eventos cuando el tiempo del bucle cruza un instante (también al dar la vuelta)
  let pc = -1e-3;
  const cross = (c, a) => pc <= c ? pc < a && a <= c : a > pc || a <= c;
  const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 7.3) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const idx = c < T0 ? -1 : Math.min(NOTES.length - 1, Math.floor((c - T0) / STEP));
    const since = idx < 0 ? 0 : c - (T0 + idx * STEP), ended = c > LAST + STEP;
    const head = c < T0 ? NX0 - 150 + 150 * clamp(c / T0) : Math.min(nx(NOTES.length - 1) + 60, NX0 + (c - T0) / STEP * NST);
    NOTES.forEach(([s, f], i) => { if (cross(c, T0 + i * STEP)) api.sound.pluck(OPEN[s] * Math.pow(2, f / 12), { decay: 2.5, bright: .5, gain: .65 }); });
    pc = c;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round';

    // ---- mástil ----
    text('Mástil con la 1ª cuerda arriba, como en la tablatura', NX - 40, FY0 - 50, { size: 22, weight: 600, alpha: .6 });
    ctx.fillStyle = hexA(C.fg, .07); ctx.fillRect(NX, FY0 - 22, FW * NFR + 20, FG * 5 + 44);
    for (let f = 1; f <= NFR; f++) { ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 4; line(NX + f * FW, FY0 - 22, NX + f * FW, fy(6) + 22); }
    ctx.fillStyle = hexA(C.fg, .85); ctx.fillRect(NX - 12, FY0 - 26, 12, FG * 5 + 52);
    for (let f = 1; f <= NFR; f++) text(String(f), NX + (f - .5) * FW, fy(6) + 62, { size: 22, weight: 700, align: 'center', alpha: .55 });
    text('traste', NX - 60, fy(6) + 62, { size: 20, weight: 600, align: 'center', alpha: .45 });
    for (let s = 1; s <= 6; s++) {
      const act = idx >= 0 && !ended && NOTES[idx][0] === s, f0 = act ? NOTES[idx][1] : 0;
      const x0 = f0 ? NX + f0 * FW : NX, x1 = NX + FW * NFR + 20, amp = act ? 9 * Math.exp(-2.2 * since) : 0;
      ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2.5 + (s - 1) * .6; line(NX, fy(s), x0, fy(s));
      ctx.strokeStyle = act ? C.brand : hexA(C.fg, .3); ctx.lineWidth = act ? 5 : 2.5 + (s - 1) * .6; ctx.beginPath();
      for (let j = 0; j <= 30; j++) { const u = j / 30, x = x0 + (x1 - x0) * u, y = fy(s) + amp * Math.sin(Math.PI * u) * Math.sin(since * 38); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      text(`${s}ª`, x1 + 18, fy(s) + 8, { size: 20, weight: 700, alpha: .6 });
    }
    // notas ya tocadas (tenues) y la actual (resaltada)
    NOTES.forEach(([s, f, nm], i) => {
      if (i > idx) return;
      const cur = i === idx && !ended, x = fxm(f), y = fy(s), r = cur ? 21 + 4 * Math.exp(-4 * since) : 17;
      if (f === 0) { ctx.strokeStyle = cur ? C.brand : hexA(C.brand, .45); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.stroke(); }
      else { ctx.fillStyle = cur ? C.brand : hexA(C.brand, .35); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      if (cur) text(nm, x, y - 36, { size: 26, weight: 800, align: 'center', color: C.brand });
    });

    // ---- tablatura ----
    for (let s = 1; s <= 6; s++) {
      ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 2.5; line(TX0, ty(s), TX1, ty(s));
      text(SNAME[s - 1], TX0 - 20, ty(s) + 8, { size: 22, weight: 700, align: 'right', alpha: .65 });
    }
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 5; line(TX0, ty(1), TX0, ty(6)); line(TX1, ty(1), TX1, ty(6));
    NOTES.forEach(([s, f, nm], i) => {
      const x = nx(i), y = ty(s), played = i <= idx, cur = i === idx && !ended;
      ctx.fillStyle = cur ? C.brand : C.bg; ctx.beginPath(); ctx.arc(x, y, 24, 0, TAU); ctx.fill();
      text(String(f), x, y + 1, { size: 34, weight: 800, align: 'center', base: 'middle', color: cur ? '#ffffff' : played ? C.brand : C.fg, alpha: played ? 1 : .85 });
      if (played) text(nm, x, ty(6) + 52, { size: 28, weight: 800, align: 'center', color: C.brand, alpha: cur ? 1 : .7 });
    });
    // cursor de lectura
    if (!ended) {
      const g = ctx.createLinearGradient(head - 70, 0, head, 0); g.addColorStop(0, hexA(C.brand, 0)); g.addColorStop(1, hexA(C.brand, .18));
      ctx.fillStyle = g; ctx.fillRect(head - 70, ty(1) - 30, 70, TG * 5 + 60);
      ctx.strokeStyle = C.brand; ctx.lineWidth = 4; line(head, ty(1) - 30, head, ty(6) + 30);
    }

    // ---- mensaje ----
    let m1, m2;
    if (idx < 0) { m1 = 'Cada línea es una cuerda; la de arriba es la 1ª (la más aguda)'; m2 = 'El número es el traste que pisas; 0 = cuerda al aire'; }
    else if (ended) { m1 = 'Acabas de tocar la escala de Do mayor'; m2 = 'Do · Re · Mi · Fa · Sol · La · Si · Do, en primera posición'; }
    else { const [s, f, nm] = NOTES[idx]; m1 = `${s}ª cuerda · ${f ? 'traste ' + f : 'al aire'} → ${nm}`; m2 = 'Se lee de izquierda a derecha, como un texto'; }
    text(m1, 120, 950, { size: 34, weight: 800, color: C.brand });
    text(m2, 120, 992, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
