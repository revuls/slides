/* Materiales — Diagrama de equilibrio hierro-carbono (Fe-C), esquema simplificado.
   Enfría una aleación (composición % C fija o la que elijas con el ratón) y muestra la zona, los constituyentes y la
   microestructura. Puntos clave de la presentación: eutéctico 4,3 % C a 1148 °C · eutectoide 0,89 % C a 723 °C ·
   aceros < 2,1 % C · fundiciones 2,1–6,69 % C. Curvas aproximadas; no sustituyen a un diagrama de referencia.
   params.secuencia: composiciones % C que recorre el enfriamiento automático. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp } = api;
  const BLUE = '#4aa3ff', FER = '#a9d8ff', CEM = '#ff7ab6', AMB = '#ffc24a', LIQ = C.brand;
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const DX0 = 1040, DX1 = 1780, DY0 = 220, DY1 = 850, TMIN = 400, TMAX = 1650, XMAX = 6.69;
  const gx = x => DX0 + x / XMAX * (DX1 - DX0), gy = T => DY1 - (T - TMIN) / (TMAX - TMIN) * (DY1 - DY0);
  const interp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return pts[pts.length - 1][1]; };
  const inv = (pts, T, lo, hi) => { let a = lo, b = hi; const f = x => interp(pts, x); const dec = f(lo) > f(hi); for (let i = 0; i < 40; i++) { const m = (a + b) / 2; ((f(m) > T) === dec) ? (a = m) : (b = m); } return (a + b) / 2; };
  // curvas (x en % C, T en °C), formas simplificadas
  const LIQ_L = [[0, 1538], [.5, 1500], [1, 1455], [1.5, 1410], [2, 1365], [3, 1262], [4.3, 1148]];
  const LIQ_R = [[4.3, 1148], [5.5, 1192], [6.69, 1227]];
  const SOL = [[0, 1538], [.17, 1495], [.6, 1440], [1, 1385], [1.5, 1270], [2.1, 1148]];
  const ACM = [[.89, 723], [1.2, 850], [1.6, 1000], [2.1, 1148]];
  const A3 = [[0, 912], [.2, 860], [.5, 780], [.89, 723]];
  const XS = .89, XE = 2.1, XC = 4.3, TE1 = 1148, TE2 = 723;

  const D = {
    state(x, T) {
      const cm = (a, b) => (x - a) / (b - a);
      const liqT = x <= XC ? interp(LIQ_L, x) : interp(LIQ_R, x);
      if (T >= liqT) return { name: 'Líquido (L)', micro: { base: 'liq' } };
      if (x < XE) {
        const solT = interp(SOL, x);
        if (T > solT) { const xl = inv(LIQ_L, T, 0, XC), xs = inv(SOL, T, 0, XE), wl = clamp((x - xs) / (xl - xs)); return { name: 'Líquido + austenita (L + γ)', ph: [{ n: 'Austenita γ', x: xs, w: 1 - wl, col: BLUE }, { n: 'Líquido', x: xl, w: wl, col: LIQ }], micro: { base: 'liq', grains: [{ col: BLUE, frac: 1 - wl }] } }; }
        const bound = x < XS ? interp(A3, x) : interp(ACM, x);
        if (T > TE2 && T > bound) return { name: 'Austenita (γ)', micro: { base: 'sol', col: BLUE } };
        if (T > TE2 && x < XS) { const xg = inv(A3, T, 0, XS), wf = clamp((xg - x) / (xg - .01)); return { name: 'Ferrita + austenita (α + γ)', ph: [{ n: 'Ferrita α', x: .01, w: wf, col: FER }, { n: 'Austenita γ', x: xg, w: 1 - wf, col: BLUE }], micro: { base: 'sol', col: BLUE, grains: [{ col: FER, frac: wf }] } }; }
        if (T > TE2) { const xg = inv(ACM, T, XS, XE), wc = clamp((x - xg) / (6.67 - xg)); return { name: 'Austenita + cementita (γ + Fe₃C)', ph: [{ n: 'Austenita γ', x: xg, w: 1 - wc, col: BLUE }, { n: 'Cementita Fe₃C', x: 6.67, w: wc, col: CEM }], micro: { base: 'sol', col: BLUE, grains: [{ col: CEM, frac: wc }] } }; }
        // por debajo de 723 °C
        if (Math.abs(x - XS) < .04) return { name: 'Perlita (100 %)', ph: [{ n: 'Perlita (ferrita + cementita)', x: XS, w: 1, col: CEM }], micro: { base: 'lam', cols: [FER, CEM], grains: [] } };
        if (x < XS) { const wf = clamp((XS - x) / (XS - .02)); return { name: 'Ferrita + perlita · acero hipoeutectoide', ph: [{ n: 'Ferrita proeutectoide', x: .02, w: wf, col: FER }, { n: 'Perlita', x: XS, w: 1 - wf, col: CEM }], micro: { base: 'lam', cols: [FER, CEM], grains: [{ col: FER, frac: wf }] } }; }
        const wc = clamp((x - XS) / (6.67 - XS)); return { name: 'Cementita + perlita · acero hipereutectoide', ph: [{ n: 'Cementita proeutectoide', x: 6.67, w: wc, col: '#ffffff' }, { n: 'Perlita', x: XS, w: 1 - wc, col: CEM }], micro: { base: 'lam', cols: [FER, CEM], grains: [{ col: '#ffffff', frac: wc }] } };
      }
      // fundiciones (x ≥ 2,1)
      if (T > TE1) {
        if (x < XC) { const xl = inv(LIQ_L, T, 0, XC), xg = clamp(2.1, 0, 2.1), wl = clamp((x - xg) / (xl - xg)); return { name: 'Líquido + austenita (L + γ)', ph: [{ n: 'Austenita γ', x: xg, w: 1 - wl, col: BLUE }, { n: 'Líquido', x: xl, w: wl, col: LIQ }], micro: { base: 'liq', grains: [{ col: BLUE, frac: 1 - wl }] } }; }
        const xl = inv(LIQ_R, T, XC, XMAX), wc = clamp((x - xl) / (6.67 - xl)); return { name: 'Líquido + cementita (L + Fe₃C)', ph: [{ n: 'Líquido', x: xl, w: 1 - wc, col: LIQ }, { n: 'Cementita Fe₃C', x: 6.67, w: wc, col: CEM }], micro: { base: 'liq', grains: [{ col: CEM, frac: wc }] } };
      }
      const hypo = x < XC - .06, hyper = x > XC + .06, below = T <= TE2;
      const pri = hypo ? (XC - x) / (XC - XE) : hyper ? (x - XC) / (XMAX - XC) : 0;
      const nm = (below ? (hypo ? 'Perlita + cementita + ledeburita (transformada)' : hyper ? 'Cementita + ledeburita (transformada)' : 'Ledeburita transformada') : (hypo ? 'Austenita + cementita + ledeburita' : hyper ? 'Cementita + ledeburita' : 'Ledeburita'));
      const ph2 = [{ n: hypo ? (below ? 'Perlita primaria' : 'Austenita primaria') : hyper ? 'Cementita primaria' : 'Ledeburita', x: 0, w: hypo || hyper ? pri : 1, col: hyper ? '#ffffff' : BLUE }];
      if (hypo || hyper) ph2.push({ n: 'Ledeburita', x: XC, w: 1 - pri, col: CEM });
      return { name: nm, ph: ph2.map(p => ({ ...p, x: p.x || 0 })), noX: true, micro: { base: 'lam', cols: [BLUE, CEM], grains: hypo ? [{ col: BLUE, frac: pri }] : hyper ? [{ col: '#ffffff', frac: pri }] : [] } };
    }
  };

  /* ---- microestructura (celdas) ---- */
  const GN = 9; let sd = 31; const rr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const V = []; for (let i = 0; i <= GN; i++) { V[i] = []; for (let j = 0; j <= GN; j++) V[i][j] = [(i + (i > 0 && i < GN ? rr() * .7 - .35 : 0)) / GN * 2 - 1, (j + (j > 0 && j < GN ? rr() * .7 - .35 : 0)) / GN * 2 - 1]; }
  const CELLS = []; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) CELLS.push({ i, j, rk: rr() });
  const ORDER = CELLS.slice().sort((a, b) => a.rk - b.rk);
  function micro(cx, cy, R, m, t) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const quad = (c, col) => { const q = [V[c.i][c.j], V[c.i + 1][c.j], V[c.i + 1][c.j + 1], V[c.i][c.j + 1]]; ctx.fillStyle = col; ctx.beginPath(); q.forEach((p, k) => k ? ctx.lineTo(cx + p[0] * R, cy + p[1] * R) : ctx.moveTo(cx + p[0] * R, cy + p[1] * R)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = hexA('#000000', .55); ctx.lineWidth = 2; ctx.stroke(); };
    if (m.base === 'liq') { const g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R); g.addColorStop(0, mix(LIQ, '#ffffff', .35)); g.addColorStop(1, mix(LIQ, '#000000', .2)); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); ctx.fillStyle = hexA('#ffffff', .25); for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(cx + Math.sin(t * .8 + k * 2.1) * R * .7, cy + Math.cos(t * .6 + k * 1.3) * R * .7, 7 + k, 0, TAU); ctx.fill(); } }
    else if (m.base === 'lam') { const w = R / 11; for (let x = -R; x < R; x += w * 2) { ctx.fillStyle = m.cols[0]; ctx.fillRect(cx + x, cy - R, w * 1.4, 2 * R); ctx.fillStyle = m.cols[1]; ctx.fillRect(cx + x + w * 1.4, cy - R, w * .6, 2 * R); } }
    else { ctx.fillStyle = m.col; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); CELLS.forEach(c => quad(c, mix(m.col, c.rk > .5 ? '#ffffff' : '#000000', .1 + c.rk * .1))); }
    if (m.grains) { let acc = 0; m.grains.forEach(g => { const a0 = Math.round(acc * ORDER.length), a1 = Math.round((acc + g.frac) * ORDER.length); for (let k = a0; k < a1; k++) quad(ORDER[k], mix(g.col, k % 2 ? '#ffffff' : '#000000', .1)); acc += g.frac; }); }
    ctx.restore(); ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  }

  function curve(pts, col, x0 = 0) { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(gx(p[0]), gy(p[1])) : ctx.moveTo(gx(p[0]), gy(p[1]))); ctx.stroke(); }
  function line(x0, x1, T, col) { ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx(x0), gy(T)); ctx.lineTo(gx(x1), gy(T)); ctx.stroke(); }
  function drawDiagram() {
    ctx.fillStyle = hexA(C.fg, .04); ctx.fillRect(DX0, DY0, DX1 - DX0, DY1 - DY0);
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(DX0, DY0 - 10); ctx.lineTo(DX0, DY1); ctx.lineTo(DX1 + 10, DY1); ctx.stroke();
    // zonas de acero y fundición
    ctx.fillStyle = hexA(BLUE, .08); ctx.fillRect(gx(0), DY0, gx(XE) - gx(0), DY1 - DY0); ctx.fillStyle = hexA(CEM, .06); ctx.fillRect(gx(XE), DY0, gx(XMAX) - gx(XE), DY1 - DY0);
    text('ACEROS', (gx(0) + gx(XE)) / 2, DY1 - 12, { size: 20, weight: 800, align: 'center', color: BLUE }); text('FUNDICIONES', (gx(XE) + gx(XMAX)) / 2, DY1 - 12, { size: 20, weight: 800, align: 'center', color: CEM });
    const L2 = '#ffd7a8', S2 = '#7cc4ff';
    curve(LIQ_L, L2); curve(LIQ_R, L2); curve(SOL, S2); curve(ACM, S2); curve(A3, S2); line(XE, XMAX, TE1, '#e8eef7'); line(0, XMAX, TE2, '#e8eef7');
    ctx.strokeStyle = hexA(CEM, .8); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(gx(XMAX), gy(TMIN)); ctx.lineTo(gx(XMAX), gy(1227)); ctx.stroke();
    [[XS, TE2, 'S · eutectoide', 0, 38], [XE, TE1, 'E', -20, -14], [XC, TE1, 'C · eutéctico', 0, -18]].forEach(([x, T, n, dx, dy]) => { ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.arc(gx(x), gy(T), 9, 0, TAU); ctx.fill(); text(n, gx(x) + dx, gy(T) + dy, { size: 20, weight: 800, align: 'center' }); });
    [['L', 3.2, 1480], ['γ', 1.2, 1110], ['L + γ', 3.1, 1215], ['γ + Fe₃C', 3.4, 920], ['α + γ', .28, 805], ['α + Fe₃C', 3.6, 580], ['L + Fe₃C', 5.6, 1120]].forEach(([n, x, T]) => text(n, gx(x), gy(T), { size: 24, weight: 800, align: 'center', alpha: .85 }));
    for (let x = 0; x <= 6; x++) { ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx(x), DY1); ctx.lineTo(gx(x), DY1 + 10); ctx.stroke(); text(String(x), gx(x), DY1 + 38, { size: 20, weight: 600, align: 'center', alpha: .7 }); }
    text('6,69', gx(XMAX), DY1 + 38, { size: 20, weight: 700, align: 'center', alpha: .8 });
    text('% C →', (DX0 + DX1) / 2, DY1 + 78, { size: 22, weight: 700, align: 'center', alpha: .75 }); text('↑ Temperatura (°C)', DX0, DY0 - 24, { size: 22, weight: 700, alpha: .8 });
    [[1500, 1500], [1148, 1148], [723, 723]].forEach(([T]) => text(String(T), DX0 - 12, gy(T) + 8, { size: 18, weight: 700, align: 'right', alpha: .6 }));
  }

  const SEQ = params.secuencia || [.89], SEGT = 14;
  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    const inside = pointer.x > DX0 - 20 && pointer.x < DX1 + 20 && pointer.y > DY0 - 20 && pointer.y < DY1 + 20;
    const c = api.static ? 8.5 : t % (SEGT * SEQ.length), seg = api.static ? 0 : Math.floor(c / SEGT) % SEQ.length, cc = c % SEGT;
    let x, T;
    if (inside) { x = clamp((pointer.x - DX0) / (DX1 - DX0) * XMAX, .02, XMAX - .03); T = clamp(TMIN + (DY1 - pointer.y) / (DY1 - DY0) * (TMAX - TMIN), TMIN, TMAX); }
    else { x = SEQ[seg]; T = lerp(1600, 470, ph(cc, .8, 11.5)); if (api.static) T = 520; }
    drawDiagram();
    const st = D.state(x, T);
    ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(gx(x), DY1); ctx.lineTo(gx(x), DY0); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 24; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gx(x), gy(T), 11, 0, TAU); ctx.fill(); ctx.restore();
    text(fmt(T, 0) + ' °C', gx(x) + 18, gy(T) - 16, { size: 22, weight: 800 });
    // lectura
    text(st.name, 120, 520, { size: st.name.length > 34 ? 28 : 34, weight: 800, color: C.brand });
    text('Contenido de carbono: ' + fmt(x, x < 1 ? 2 : 1) + ' % C  ·  ' + (x < XE ? 'acero' : 'fundición'), 120, 566, { size: 24, weight: 700, alpha: .85 });
    micro(300, 760, 130, st.micro, t);
    (st.ph || []).forEach((p, i) => { text(p.n, 480, 690 + i * 78, { size: 24, weight: 800, color: p.col === LIQ ? C.brandXl : p.col === '#ffffff' ? '#ffffff' : p.col }); if (!st.noX) text('proporción: ' + fmt(p.w * 100) + ' %', 480, 722 + i * 78, { size: 24, weight: 700 }); else text('≈ ' + fmt(p.w * 100, 0) + ' %', 480, 722 + i * 78, { size: 24, weight: 700 }); });
    if (!st.ph) text(st.name.indexOf('Líquido') === 0 ? 'Mezcla líquida homogénea' : 'Una sola fase sólida', 480, 760, { size: 24, weight: 700, alpha: .85 });
    text(inside ? 'Suelta el ratón para ver el enfriamiento automático' : 'Pasa el ratón por el diagrama para explorar', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
