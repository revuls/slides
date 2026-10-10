/* Materiales — Diagramas de tracción de distintos metales (σ-ε).
   Curvas ILUSTRATIVAS de forma cualitativa; no son datos medidos. Ciclo 25 s: se dibujan una a una;
   pasa el ratón sobre una etiqueta de la leyenda para resaltar su curva. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const PX0 = 1000, PX1 = 1780, PY0 = 200, PY1 = 860;
  const BLUE = '#4aa3ff', GRN = '#5fd08a', PINK = '#ff7ab6', AMB = '#ffc24a';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  // [nombre, color, fin x, función σ(x) normalizada, descripción]
  const SET = [
    ['Aluminio-cobre', GRN, .86, x => { const u = x / .86; return .34 * (1 - Math.exp(-u * 9)) * (1 + .14 * u) * (1 - .35 * Math.pow(u, 5)); }, 'Dúctil: gran zona plástica antes de romper'],
    ['Metales deformados en frío', AMB, .46, x => { const u = x / .46; return .5 * (1 - Math.exp(-u * 11)) * (1 - .12 * Math.pow(u, 3)); }, 'Más resistentes, pero con menos ductilidad'],
    ['Hierro fundido', BLUE, .14, x => { const u = x / .14; return .26 * (1 - Math.pow(1 - u, 1.8)); }, 'Frágil: rompe casi sin deformación plástica'],
    ['Bronce', C.brand, .5, x => { const u = x / .5; return .46 * (1 - Math.exp(-u * 8)) * (1 - .25 * Math.pow(u, 4)) * (1 + .1 * u); }, 'Resistencia media y cierta ductilidad'],
    ['Acero templado', PINK, .2, x => { const u = x / .2; return .95 * (1 - Math.exp(-u * 14)) * (1 - .1 * Math.pow(u, 6)); }, 'Muy resistente y duro, poco deformable']
  ];
  const gx = x => PX0 + x * (PX1 - PX0), gy = s => PY1 - s * (PY1 - PY0) * 1.0;
  const SEGT = 4, CYC = SEGT * SET.length + 5;
  const leg = SET.map((s, i) => ({ x: 130, y: 700 + (i - 1) * 54 - 14 }));

  function curve(k, p, hl) {
    const [name, col, xe, f] = SET[k];
    if (p <= 0) return;
    ctx.lineWidth = hl ? 10 : 6; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    const N = 120, M = Math.max(2, Math.floor(N * p));
    for (let i = 0; i <= M; i++) { const x = xe * p * i / M; i ? ctx.lineTo(gx(x), gy(f(x))) : ctx.moveTo(gx(x), gy(f(x))); }
    ctx.stroke();
    const xe2 = xe * p, cx = gx(xe2), cy = gy(f(xe2));
    if (p >= 1) { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 12, cy - 12); ctx.lineTo(cx + 12, cy + 12); ctx.moveTo(cx + 12, cy - 12); ctx.lineTo(cx - 12, cy + 12); ctx.stroke(); text(name, cx + 18, cy - 14, { size: hl ? 28 : 24, weight: 800, color: col }); }
    else { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, TAU); ctx.fill(); ctx.restore(); }
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    const c = api.static ? 22 : t % CYC;
    // ejes
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX0, PY0 - 10); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1 + 10, PY1); ctx.stroke();
    text('σ', PX0 - 16, PY0 + 14, { size: 34, weight: 800, align: 'right' }); text('ε', PX1 + 4, PY1 + 44, { size: 34, weight: 800, align: 'right' });
    // resalte por ratón sobre la leyenda
    let hov = -1; leg.forEach((l, i) => { if (pointer.x > l.x - 20 && pointer.x < l.x + 640 && pointer.y > l.y - 6 && pointer.y < l.y + 48) hov = i; });
    const cur = hov >= 0 ? hov : Math.min(SET.length - 1, Math.floor(c / SEGT));
    SET.forEach((s, i) => {
      const p = api.static || hov >= 0 || c > SEGT * SET.length ? 1 : i < cur ? 1 : i === cur ? ph(c - i * SEGT, 0, SEGT * .8) : 0;
      ctx.globalAlpha = hov >= 0 && i !== hov ? .3 : 1; curve(i, p, i === cur && hov >= 0); ctx.globalAlpha = 1;
    });
    // leyenda
    leg.forEach((l, i) => {
      const on = i === cur, [name, col, , , desc] = SET[i];
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(l.x + 12, l.y + 20, 11, 0, TAU); ctx.fill();
      text(name, l.x + 38, l.y + 20, { size: 28, weight: 800, base: 'middle', alpha: on ? 1 : .6, color: on ? col : C.fg });
    });
    text(SET[cur][4], 130, 990, { size: 26, weight: 700, color: SET[cur][1] });
    text('Curvas ilustrativas · pasa el ratón por la leyenda', 130, 960, { size: 20, weight: 600, alpha: .5 });
  }
  return { frame };
});
