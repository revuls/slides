/* Materiales — Diagrama de fases presión-temperatura del agua (esquema cualitativo, no a escala).
   Mueve el ratón por el diagrama para elegir presión y temperatura; si no, un punto recorre tres caminos
   (sublimación, fusión + ebullición y fluido supercrítico). Ciclo 24 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, text, clamp, lerp } = api;
  const BLUE = '#4aa3ff', ICE = '#bfe6ff';
  const X0 = 1020, X1 = 1760, Y0 = 200, Y1 = 900;
  const T3 = [.3, .18], CR = [.9, .62];                          // punto triple y crítico (fracciones x, y desde abajo)
  const px = f => X0 + f * (X1 - X0), py = f => Y1 - f * (Y1 - Y0);
  const sbl = u => [lerp(0, T3[0], u), T3[1] * Math.pow(u, 1.6)];
  const vap = u => [lerp(T3[0], CR[0], u), lerp(T3[1], CR[1], Math.pow(u, .7))];
  const fus = u => [lerp(T3[0], T3[0] - .07, u), lerp(T3[1], 1, u)];
  const yVap = x => lerp(T3[1], CR[1], Math.pow(clamp((x - T3[0]) / (CR[0] - T3[0])), .7));
  // 0 sólido · 1 líquido · 2 gas · 3 fluido supercrítico
  const zone = (x, y) => {
    if (y < T3[1]) return x < T3[0] && y > T3[1] * Math.pow(x / T3[0], 1.6) ? 0 : 2;
    if (x < T3[0] - .07 * (y - T3[1]) / (1 - T3[1])) return 0;
    if (x > CR[0] && y > CR[1]) return 3;
    if (x <= T3[0]) return 1;
    return y > yVap(x) ? 1 : 2;
  };
  const NAMES = ['Sólido', 'Líquido', 'Gas', 'Fluido supercrítico'];
  const COLS = [ICE, BLUE, C.brand, C.brandXl];
  const PATH = [
    { y: .1, label: 'Presión baja: el hielo sublima (sólido → gas)' },
    { y: .4, label: 'Presión media: fusión y después ebullición' },
    { y: .8, label: 'Presión alta: del líquido al fluido supercrítico' }
  ];

  function curve(fn, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const [x, y] = fn(i / 60); i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y)); }
    ctx.stroke();
  }
  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    const inside = pointer.x > X0 && pointer.x < X1 && pointer.y > Y0 && pointer.y < Y1;
    const c = api.static ? 12 : t % 24, k = Math.floor(c / 8), u = (c % 8) / 8;
    let fx, fy, label = null;
    if (inside) { fx = (pointer.x - X0) / (X1 - X0); fy = (Y1 - pointer.y) / (Y1 - Y0); }
    else { fy = PATH[k].y; fx = .03 + .94 * clamp((u - .08) / .84); label = PATH[k].label; }

    ctx.fillStyle = hexA(C.fg, .04); ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(X0, Y0, X1 - X0, Y1 - Y0); ctx.fill(); ctx.stroke();
    text('SÓLIDO', px(.1), py(.62), { size: 34, weight: 800, align: 'center', color: ICE });
    text('LÍQUIDO', px(.52), py(.84), { size: 34, weight: 800, align: 'center', color: BLUE });
    text('GAS', px(.6), py(.07), { size: 34, weight: 800, align: 'center', color: C.brand });
    curve(sbl, C.fg); curve(fus, C.fg); curve(vap, C.fg);
    ctx.setLineDash([10, 12]); ctx.lineWidth = 4; ctx.strokeStyle = hexA(C.fg, .6); ctx.beginPath(); ctx.moveTo(px(CR[0]), py(CR[1])); ctx.lineTo(px(CR[0]), py(CR[1]) - 120); ctx.moveTo(px(CR[0]), py(CR[1])); ctx.lineTo(px(CR[0]) + 80, py(CR[1])); ctx.stroke(); ctx.setLineDash([]);
    const pt = (p, label, dx, dy, al) => { ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.arc(px(p[0]), py(p[1]), 11, 0, TAU); ctx.fill(); text(label, px(p[0]) + dx, py(p[1]) + dy, { size: 26, weight: 700, align: al || 'left' }); };
    pt(T3, 'Punto triple', 26, 42); pt(CR, 'Punto crítico', -24, 46, 'right');
    text('Temperatura →', X1, Y1 + 54, { size: 26, weight: 700, align: 'right', alpha: .8 });
    text('↑ Presión', X0, Y0 - 22, { size: 26, weight: 700, alpha: .8 });
    if (!inside) { ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 3; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.moveTo(X0, py(fy)); ctx.lineTo(X1, py(fy)); ctx.stroke(); ctx.setLineDash([]); }
    const z = zone(fx, fy), zc = COLS[z];
    ctx.save(); ctx.shadowColor = zc; ctx.shadowBlur = 30; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px(fx), py(fy), 15, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = zc; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px(fx), py(fy), 24, 0, TAU); ctx.stroke();
    text(NAMES[z], 120, 760, { size: z === 3 ? 60 : 84, weight: 800, color: zc });
    text(label || 'Mueve el ratón: cada punto (T, P) está en una fase', 120, 820, { size: 28, weight: 600, alpha: .85 });
    text('Esquema cualitativo del agua · escalas no proporcionales', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
