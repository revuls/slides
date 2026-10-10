/* Materiales — Alotropía del hierro puro: curva de enfriamiento y celdilla en cada fase.
   Temperaturas de cambio según la presentación original (δ 1400–1539 °C · γ 910–1400 °C · β 768–910 °C · α < 768 °C).
   Eje de tiempo ilustrativo. Mueve el ratón sobre la curva para elegir la temperatura. Ciclo 22 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const BLUE = '#4aa3ff', GRN = '#5fd08a', PINK = '#ff7ab6', AMB = '#ffc24a';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const X0 = 960, X1 = 1360, Y0 = 220, Y1 = 860, TMIN = 100, TMAX = 1700;
  const gy = T => Y1 - (T - TMIN) / (TMAX - TMIN) * (Y1 - Y0), gx = u => X0 + u * (X1 - X0);
  // curva de enfriamiento (u = tiempo 0..1, T)
  const PTS = [[0, 1680], [.07, 1539], [.15, 1539], [.28, 1400], [.36, 1400], [.55, 910], [.64, 910], [.77, 768], [.82, 768], [1, 120]];
  const Tof = u => { for (let i = 1; i < PTS.length; i++) if (u <= PTS[i][0]) { const a = PTS[i - 1], b = PTS[i]; return lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0])); } return PTS[PTS.length - 1][1]; };
  const PH = [
    { n: 'Líquido', from: 1539, col: C.brand, st: '—', d: 'Átomos sin orden fijo' },
    { n: 'Hierro δ', from: 1400, col: AMB, st: 'BCC', d: 'Poca aplicación industrial · 1400–1539 °C' },
    { n: 'Hierro γ', from: 910, col: BLUE, st: 'FCC', d: 'Disuelve hasta ≈2 % de C: austenita · 910–1400 °C' },
    { n: 'Hierro β', from: 768, col: GRN, st: 'BCC', d: 'No magnético · 768–910 °C' },
    { n: 'Hierro α', from: -999, col: PINK, st: 'BCC', d: 'Magnético · poca solubilidad de C' }
  ];
  const phaseOf = T => T > 1539 ? 0 : T > 1400 ? 1 : T > 910 ? 2 : T > 768 ? 3 : 4;

  /* celdilla 3D pequeña */
  let yaw = .5, pitch = .4, lastX = null;
  const proj = (p, S, cx, cy) => { const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); const x1 = p[0] * cyw + p[2] * syw, z1 = -p[0] * syw + p[2] * cyw, y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp; return { x: cx + x1 * S, y: cy - y2 * S, z: z2 }; };
  function cell(kind, cx, cy, col, alpha, mag) {
    const S = 170, R = .3 * S * .9;
    const at = []; [-1, 1].forEach(x => [-1, 1].forEach(y => [-1, 1].forEach(z => at.push([x * .5, y * .5, z * .5]))));
    if (kind === 'BCC') at.push([0, 0, 0]); if (kind === 'FCC') [-1, 1].forEach(s => { at.push([s * .5, 0, 0], [0, s * .5, 0], [0, 0, s * .5]); });
    const P = at.map(p => ({ q: proj(p, S, cx, cy), p })).sort((a, b) => a.q.z - b.q.z);
    ctx.globalAlpha = alpha;
    const ed = []; const V = at.slice(0, 8); V.forEach((a, i) => V.forEach((b, j) => { if (j > i && (a[0] !== b[0]) + (a[1] !== b[1]) + (a[2] !== b[2]) === 1) ed.push([a, b]); }));
    ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 3; ed.forEach(([a, b]) => { const A = proj(a, S, cx, cy), B = proj(b, S, cx, cy); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
    P.forEach(({ q, p }) => { const g = ctx.createRadialGradient(q.x - R * .35, q.y - R * .35, R * .1, q.x, q.y, R); g.addColorStop(0, mix(col, '#ffffff', .55)); g.addColorStop(1, mix(col, '#000000', .35)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.fill();
      if (mag) { ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x, q.y + 14); ctx.lineTo(q.x, q.y - 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q.x, q.y - 22); ctx.lineTo(q.x - 8, q.y - 10); ctx.lineTo(q.x + 8, q.y - 10); ctx.fill(); } });
    ctx.globalAlpha = 1;
  }
  function liquid(cx, cy, col, t) {
    for (let i = 0; i < 28; i++) { const a = i * 2.4 + t * (.4 + (i % 5) * .1), r = 40 + (i % 7) * 22; const x = cx + Math.cos(a) * r * 1.2, y = cy + Math.sin(a * 1.3 + i) * r * .9; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); }
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const inside = pointer.x > X0 - 30 && pointer.x < X1 + 60 && pointer.y > Y0 - 30 && pointer.y < Y1 + 30;
    const CYC = 22, c = api.static ? 14 : t % CYC, fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : 1;
    const u = inside ? clamp((pointer.x - X0) / (X1 - X0)) : ph(c, 1, 19);
    const T = Tof(inside ? u : api.static ? .72 : u);
    if (pointer.down && pointer.x > 1400) { if (lastX !== null) yaw += (pointer.x - lastX) * .01; lastX = pointer.x; } else { lastX = null; yaw += dt * .5; }
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
    // ejes y rejilla de fases
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X0, Y0 - 10); ctx.lineTo(X0, Y1); ctx.lineTo(X1 + 10, Y1); ctx.stroke();
    text('Temperatura (°C)', X0, Y0 - 24, { size: 22, weight: 700, alpha: .8 }); text('Tiempo', X1, Y1 + 44, { size: 22, weight: 700, align: 'right', alpha: .8 });
    [1539, 1400, 910, 768].forEach(Tm => { ctx.setLineDash([6, 8]); ctx.strokeStyle = hexA(C.fg, .25); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0, gy(Tm)); ctx.lineTo(X1, gy(Tm)); ctx.stroke(); ctx.setLineDash([]); text(String(Tm), X0 - 12, gy(Tm) + 8, { size: 20, weight: 700, align: 'right', alpha: .8 }); });
    // etiquetas de fase entre plateaus
    [[1620, 'L'], [1470, 'δ'], [1150, 'γ'], [840, 'β'], [440, 'α']].forEach(([Tm, n], i) => text(n, X1 + 30, gy(Tm) + 10, { size: 32, weight: 800, color: PH[i].col }));
    // curva hasta el instante actual
    ctx.lineWidth = 7; ctx.lineJoin = 'round';
    const N = 260, M = Math.max(2, Math.floor(N * u)); ctx.strokeStyle = C.brand; ctx.beginPath();
    for (let i = 0; i <= M; i++) { const uu = u * i / M; i ? ctx.lineTo(gx(uu), gy(Tof(uu))) : ctx.moveTo(gx(uu), gy(Tof(uu))); } ctx.stroke();
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 26; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx(u), gy(T), 12, 0, TAU); ctx.fill(); ctx.restore();
    text(Math.round(T / 10) * 10 + ' °C', gx(u) + 20, gy(T) - 18, { size: 24, weight: 800 });
    // celdilla
    const k = phaseOf(T), P = PH[k], cx = 1640, cy = 560;
    if (k === 0) liquid(cx, cy, hexA(P.col, .85), t); else cell(P.st, cx, cy, P.col, 1, k === 4);
    text(P.n, 1640, 330, { size: 52, weight: 800, align: 'center', color: P.col });
    text(P.st === '—' ? 'Sin estructura cristalina' : 'Estructura ' + P.st, 1640, 380, { size: 28, weight: 700, align: 'center' });
    text(k === 4 ? 'Flechas: orden magnético' : '', 1640, 800, { size: 22, weight: 600, align: 'center', alpha: .7 });
    text(P.n, 120, 640, { size: 46, weight: 800, color: P.col });
    text(P.d, 120, 690, { size: 26, weight: 700, alpha: .9 });
    text('El hierro cambia de red cristalina al enfriarse', 120, 760, { size: 24, weight: 600, alpha: .8 });
    text('(alotropía): clave para aceros y fundiciones', 120, 796, { size: 24, weight: 600, alpha: .8 });
    text('Mueve el ratón por la curva · arrastra para girar la celdilla', 120, 990, { size: 22, weight: 600, alpha: .5 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
