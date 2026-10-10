/* Materiales — Diagramas de equilibrio de fases de aleaciones binarias A-B (esquemas didácticos, no son datos reales).
   params.modo:
     'curvas'   metal puro frente a aleación: curvas de enfriamiento (platea frente a intervalo).
     'construir' curvas de enfriamiento de varias composiciones → puntos de liquidus/solidus → diagrama.
     'explorar' (por defecto) enfría una aleación y mide fases: pasa el ratón por el diagrama para elegir composición y
                temperatura; muestra zona, regla de la horizontal, regla de la palanca y microestructura.
   params.diagrama: 'iso' (solubles en todo) | 'eut' (insolubles en sólido) | 'parcial' (parcialmente solubles).
   params.secuencia: composiciones (% B) que recorre el enfriamiento automático. params.pausa: [T, segundos]. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const MODO = params.modo || 'explorar', DIAG = params.diagrama || 'iso';
  const BLUE = '#4aa3ff', GRN = '#5fd08a', LIQ = C.brand, LINE = '#e8eef7';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const pw = (b, e) => Math.pow(Math.max(0, b), e);
  const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const DX0 = 1030, DX1 = 1770, DY0 = 230, DY1 = 850;

  /* ================= definición de los tres diagramas ================= */
  const DEFS = {
    iso: (() => {
      const TL = x => 1600 - 500 * pw(x / 100, 2.57), TS = x => 1600 - 500 * (1 - pw(1 - x / 100, 4.85));
      return {
        tMin: 1000, tMax: 1700, names: ['A', 'B'],
        lines: [{ f: TL, col: C.brandXl, n: 'Línea de liquidus', at: [68, 1420] }, { f: TS, col: '#7cc4ff', n: 'Línea de solidus', at: [40, 1130] }],
        zones: [[10, 1550, 'L'], [18, 1060, 'α'], [60, 1330, 'L + α']],
        state(x, T) {
          if (T >= TL(x)) return { name: 'Líquido (L)', micro: { base: 'liq' } };
          if (T <= TS(x)) return { name: 'Sólido α', micro: { base: 'sol', col: BLUE } };
          const r = (1600 - T) / 500, xs = 100 * (1 - pw(1 - r, 1 / 4.85)), xl = 100 * pw(r, 1 / 2.57), wl = (x - xs) / (xl - xs);
          return { name: 'Zona bifásica L + α', tie: [xs, xl], ph: [{ n: 'α', x: xs, w: 1 - wl, col: BLUE }, { n: 'Líquido', x: xl, w: wl, col: LIQ }], micro: { base: 'liq', grains: [{ col: BLUE, frac: 1 - wl }] }, two: true };
        },
        top: x => TL(x), inv: x => (x < .5 || x > 99.5) ? [x < 50 ? 1600 : 1100, 40] : null, sol: x => TS(x), liqd: x => TL(x)
      };
    })(),
    eut: (() => {
      const TE = 520, XE = 60, TL = x => x <= XE ? 1000 - 480 * pw(x / XE, 1.2) : 900 - 380 * pw((100 - x) / (100 - XE), 1.2);
      return {
        tMin: 100, tMax: 1100, names: ['A', 'B'],
        lines: [{ f: x => x <= XE ? TL(x) : null, col: C.brandXl, n: 'Liquidus', at: [18, 800] }, { f: x => x >= XE ? TL(x) : null, col: C.brandXl, n: 'Liquidus', at: [80, 720] }, { f: x => TE, col: LINE, n: 'Línea eutéctica' }],
        zones: [[60, 900, 'L'], [16, 400, 'A + B'], [18, 650, 'L + A'], [86, 560, 'L + B']],
        state(x, T) {
          if (T >= TL(x)) return { name: 'Líquido (L)', micro: { base: 'liq' } };
          if (T > TE && x < XE) { const xl = XE * pw((1000 - T) / 480, 1 / 1.2), wa = (xl - x) / xl; return { name: 'Zona bifásica L + A', tie: [0, xl], ph: [{ n: 'A (casi pura)', x: 0, w: wa, col: BLUE }, { n: 'Líquido', x: xl, w: 1 - wa, col: LIQ }], micro: { base: 'liq', grains: [{ col: BLUE, frac: wa }] }, two: true }; }
          if (T > TE) { const xl = 100 - (100 - XE) * pw((900 - T) / 380, 1 / 1.2), wb = (x - xl) / (100 - xl); return { name: 'Zona bifásica L + B', tie: [xl, 100], ph: [{ n: 'Líquido', x: xl, w: 1 - wb, col: LIQ }, { n: 'B (casi puro)', x: 100, w: wb, col: GRN }], micro: { base: 'liq', grains: [{ col: GRN, frac: wb }] }, two: true }; }
          const eu = Math.abs(x - XE) < 2.5, pa = x < XE ? (XE - x) / XE : (x - XE) / (100 - XE);
          return { name: eu ? 'A + B · estructura eutéctica' : 'A + B · ' + (x < XE ? 'hipoeutéctica' : 'hipereutéctica'), tie: [0, 100], ph: [{ n: 'A', x: 0, w: (100 - x) / 100, col: BLUE }, { n: 'B', x: 100, w: x / 100, col: GRN }], micro: { base: 'lam', cols: [BLUE, GRN], grains: eu ? [] : [{ col: x < XE ? BLUE : GRN, frac: pa }] }, two: true };
        },
        top: x => TL(x), inv: x => (x < .5 || x > 99.5) ? [x < 50 ? 1000 : 900, 40] : [TE, 60 * (x <= XE ? x / XE : (100 - x) / (100 - XE)) + 6], sol: x => TE, liqd: x => TL(x), te: TE
      };
    })(),
    parcial: (() => {
      const TE = 500, XE = 62, XA = 20, XB = 88;
      const TL = x => x <= XE ? 1000 - 500 * pw(x / XE, 1.2) : 900 - 400 * pw((100 - x) / (100 - XE), 1.2);
      const TSa = x => 1000 - 500 * pw(x / XA, 1.1), TSb = x => 900 - 400 * pw((100 - x) / (100 - XB), 1.1);
      const sa = T => XA - 12 * clamp(pw((TE - T) / 400, 1.2)), sb = T => XB + 8 * clamp(pw((TE - T) / 400, 1.2));
      return {
        tMin: 100, tMax: 1100, names: ['A', 'B'],
        lines: [{ f: x => x <= XE ? TL(x) : null, col: C.brandXl, n: 'Liquidus', at: [14, 860] }, { f: x => x >= XE ? TL(x) : null, col: C.brandXl, n: '', at: [80, 700] }, { f: x => x <= XA ? TSa(x) : null, col: '#7cc4ff', n: 'Solidus', at: [6, 700] }, { f: x => x >= XB ? TSb(x) : null, col: '#7cc4ff', n: '' },
          { f: x => x >= XA && x <= XB ? TE : null, col: LINE, n: '' }, { fy: T => T <= TE ? sa(T) : null, col: '#c7a4ff', n: 'Solvus', at: [8, 190] }, { fy: T => T <= TE ? sb(T) : null, col: '#c7a4ff', n: '' }],
        zones: [[60, 920, 'L'], [3, 400, 'α'], [94, 380, 'β'], [50, 260, 'α + β'], [24, 690, 'L + α'], [78, 650, 'L + β']],
        state(x, T) {
          if (T >= TL(x)) return { name: 'Líquido (L)', micro: { base: 'liq' } };
          if (T > TE) {
            if (x <= XA && T <= TSa(x)) return { name: 'Solución sólida α', micro: { base: 'sol', col: BLUE } };
            if (x >= XB && T <= TSb(x)) return { name: 'Solución sólida β', micro: { base: 'sol', col: GRN } };
            if (x < XE) { const r = (1000 - T) / 500, xs = XA * pw(r, 1 / 1.1), xl = XE * pw((1000 - T) / 500, 1 / 1.2), wa = (xl - x) / (xl - xs); return { name: 'Zona bifásica L + α', tie: [xs, xl], ph: [{ n: 'α', x: xs, w: wa, col: BLUE }, { n: 'Líquido', x: xl, w: 1 - wa, col: LIQ }], micro: { base: 'liq', grains: [{ col: BLUE, frac: wa }] }, two: true }; }
            const xl = 100 - (100 - XE) * pw((900 - T) / 400, 1 / 1.2), xs = 100 - (100 - XB) * pw((900 - T) / 400, 1 / 1.1), wl = (xs - x) / (xs - xl);
            return { name: 'Zona bifásica L + β', tie: [xl, xs], ph: [{ n: 'Líquido', x: xl, w: wl, col: LIQ }, { n: 'β', x: xs, w: 1 - wl, col: GRN }], micro: { base: 'liq', grains: [{ col: GRN, frac: 1 - wl }] }, two: true };
          }
          const xa = sa(T), xb = sb(T);
          if (x <= xa) return { name: 'Solución sólida α', micro: { base: 'sol', col: BLUE } };
          if (x >= xb) return { name: 'Solución sólida β', micro: { base: 'sol', col: GRN } };
          const wa = (xb - x) / (xb - xa), ph2 = [{ n: 'α', x: xa, w: wa, col: BLUE }, { n: 'β', x: xb, w: 1 - wa, col: GRN }];
          let micro;
          if (x < XA) micro = { base: 'sol', col: BLUE, prec: 1 - wa, pcol: GRN };
          else if (x > XB) micro = { base: 'sol', col: GRN, prec: wa, pcol: BLUE };
          else if (Math.abs(x - XE) < 2.5) micro = { base: 'lam', cols: [BLUE, GRN], grains: [] };
          else micro = { base: 'lam', cols: [BLUE, GRN], grains: [{ col: x < XE ? BLUE : GRN, frac: x < XE ? (XE - x) / (XE - XA) : (x - XE) / (XB - XE) }] };
          return { name: 'Zona bifásica sólida α + β', tie: [xa, xb], ph: ph2, micro, two: true };
        },
        top: x => TL(x), inv: x => (x < .5 || x > 99.5) ? [x < 50 ? 1000 : 900, 40] : (x >= XA && x <= XB ? [TE, 60 * (x <= XE ? (x - XA) / (XE - XA) : (XB - x) / (XB - XE)) + 6] : null),
        sol: x => x <= XA ? TSa(x) : x >= XB ? TSb(x) : TE, liqd: x => TL(x), te: TE
      };
    })()
  };
  const D = DEFS[DIAG];
  const gx = x => DX0 + x / 100 * (DX1 - DX0), gy = T => DY1 - (T - D.tMin) / (D.tMax - D.tMin) * (DY1 - DY0);
  const sgn = k => { let s = k; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

  /* ================= celdas de la microestructura ================= */
  const GN = 9, rr = sgn(31), V = [];
  for (let i = 0; i <= GN; i++) { V[i] = []; for (let j = 0; j <= GN; j++) V[i][j] = [(i + (i > 0 && i < GN ? rr() * .7 - .35 : 0)) / GN * 2 - 1, (j + (j > 0 && j < GN ? rr() * .7 - .35 : 0)) / GN * 2 - 1]; }
  const CELLS = []; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) CELLS.push({ i, j, rk: rr() });
  const ORDER = CELLS.slice().sort((a, b) => a.rk - b.rk);
  const DOTS = Array.from({ length: 70 }, () => [rr() * 2 - 1, rr() * 2 - 1, rr()]);
  function micro(cx, cy, R, m, t) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const quad = (c, col) => { const [a, b, d, e] = [V[c.i][c.j], V[c.i + 1][c.j], V[c.i + 1][c.j + 1], V[c.i][c.j + 1]]; ctx.fillStyle = col; ctx.beginPath(); [a, b, d, e].forEach((p, k) => k ? ctx.lineTo(cx + p[0] * R, cy + p[1] * R) : ctx.moveTo(cx + p[0] * R, cy + p[1] * R)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = hexA('#000000', .55); ctx.lineWidth = 2; ctx.stroke(); };
    if (m.base === 'liq') {
      const g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R); g.addColorStop(0, mix(LIQ, '#ffffff', .35)); g.addColorStop(1, mix(LIQ, '#000000', .2)); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      ctx.fillStyle = hexA('#ffffff', .25); for (let k = 0; k < 8; k++) { const d = DOTS[k]; ctx.beginPath(); ctx.arc(cx + Math.sin(t * .8 + d[2] * 9) * R * .7, cy + Math.cos(t * .6 + d[0] * 7) * R * .7, 6 + d[2] * 8, 0, TAU); ctx.fill(); }
    } else if (m.base === 'lam') {
      const w = R / 11; for (let x = -R; x < R; x += w * 2) { ctx.fillStyle = m.cols[0]; ctx.fillRect(cx + x, cy - R, w, 2 * R); ctx.fillStyle = m.cols[1]; ctx.fillRect(cx + x + w, cy - R, w, 2 * R); }
    } else { ctx.fillStyle = m.col; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R); CELLS.forEach(c => quad(c, mix(m.col, c.rk > .5 ? '#ffffff' : '#000000', .1 + c.rk * .1))); }
    if (m.grains) { let acc = 0; m.grains.forEach(g => { const a0 = Math.round(acc * ORDER.length), a1 = Math.round((acc + g.frac) * ORDER.length); for (let k = a0; k < a1; k++) quad(ORDER[k], mix(g.col, k % 2 ? '#ffffff' : '#000000', .12)); acc += g.frac; }); }
    if (m.prec) { ctx.fillStyle = m.pcol; const n = Math.round(m.prec * 70); for (let k = 0; k < n && k < DOTS.length; k++) { ctx.beginPath(); ctx.arc(cx + DOTS[k][0] * R * .9, cy + DOTS[k][1] * R * .9, 6, 0, TAU); ctx.fill(); } }
    ctx.restore();
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  }

  /* ================= dibujo del diagrama ================= */
  function drawDiagram(fade) {
    ctx.fillStyle = hexA(C.fg, .04); ctx.fillRect(DX0, DY0, DX1 - DX0, DY1 - DY0);
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(DX0, DY0 - 10); ctx.lineTo(DX0, DY1); ctx.lineTo(DX1 + 10, DY1); ctx.stroke();
    D.lines.forEach(l => {
      ctx.strokeStyle = l.col; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath(); let on = false;
      if (l.f) for (let x = 0; x <= 100.001; x += 1) { const T = l.f(x); if (T === null || T < D.tMin - 1) { on = false; continue; } on ? ctx.lineTo(gx(x), gy(T)) : ctx.moveTo(gx(x), gy(T)); on = true; }
      if (l.fy) for (let T = D.tMin; T <= D.te + .1; T += 5) { const x = l.fy(T); x === null ? (on = false) : (on ? ctx.lineTo(gx(x), gy(T)) : ctx.moveTo(gx(x), gy(T))); on = true; }
      ctx.stroke();
      if (l.n && l.at) text(l.n, gx(l.at[0]), gy(l.at[1]), { size: 20, weight: 700, color: l.col, align: 'center' });
    });
    D.zones.forEach(([x, T, n]) => text(n, gx(x), gy(T), { size: 32, weight: 800, align: 'center', alpha: .85 }));
    text('A', DX0 - 4, DY1 + 42, { size: 28, weight: 800, align: 'center', color: BLUE }); text('B', DX1 + 2, DY1 + 42, { size: 28, weight: 800, align: 'center', color: GRN });
    text('% B →', (DX0 + DX1) / 2, DY1 + 86, { size: 24, weight: 700, align: 'center', alpha: .75 });
    text('↑ Temperatura', DX0, DY0 - 24, { size: 24, weight: 700, alpha: .8 });
    for (let x = 25; x <= 75; x += 25) { ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx(x), DY1); ctx.lineTo(gx(x), DY1 + 10); ctx.stroke(); text(String(x), gx(x), DY1 + 40, { size: 20, weight: 600, align: 'center', alpha: .6 }); }
  }

  /* ================= modo curvas (metal puro frente a aleación) ================= */
  function modoCurvas(c) {
    const fade = c > 15.4 ? clamp(1 - (c - 15.4) / .6) : 1; ctx.globalAlpha = fade;
    const CH = [{ x0: 980, n: 'Metal puro', pts: [[0, 1200], [2.2, 700], [5.8, 700], [8, 200]], note: 'Solidifica a temperatura fija', mark: [4, 700] },
      { x0: 1420, n: 'Aleación', pts: [[0, 1200], [2.2, 800], [4.5, 650], [5.4, 600], [8, 200]], note: 'Cristaliza en un intervalo', mark: [3.4, 725] }];
    const y0 = 250, y1 = 840, w = 360, gy2 = T => y1 - (T - 200) / 1000 * (y1 - y0), p = ph(c, 1, 12);
    CH.forEach(ch => {
      const gx2 = tt => ch.x0 + tt / 8 * w;
      ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ch.x0, y0 - 10); ctx.lineTo(ch.x0, y1); ctx.lineTo(ch.x0 + w + 10, y1); ctx.stroke();
      text(ch.n, ch.x0 + w / 2, y0 - 30, { size: 30, weight: 800, align: 'center', color: C.brand });
      [1200, 700, 200].forEach(T => { text(String(T), ch.x0 - 12, gy2(T) + 8, { size: 20, weight: 600, align: 'right', alpha: .7 }); ctx.strokeStyle = hexA(C.fg, .12); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ch.x0, gy2(T)); ctx.lineTo(ch.x0 + w, gy2(T)); ctx.stroke(); });
      text('Tiempo (s)', ch.x0 + w, y1 + 44, { size: 20, weight: 600, align: 'right', alpha: .7 }); text('Temperatura (°C)', ch.x0, y0 - 6, { size: 20, weight: 600, alpha: .7 });
      const tEnd = 8 * p; ctx.strokeStyle = C.brand; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); let started = false, last = [0, 0];
      for (let i = 1; i < ch.pts.length; i++) { const a = ch.pts[i - 1], b = ch.pts[i]; if (tEnd <= a[0]) break; const u = clamp((tEnd - a[0]) / (b[0] - a[0])), px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u; if (!started) { ctx.moveTo(gx2(a[0]), gy2(a[1])); started = true; } ctx.lineTo(gx2(px), gy2(py)); last = [px, py]; }
      ctx.stroke();
      if (p > 0 && p < 1) { ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx2(last[0]), gy2(last[1]), 11, 0, TAU); ctx.fill(); ctx.restore(); }
      const nt = ph(c, ch.mark[0] / 8 * 11 + 1 + .3, ch.mark[0] / 8 * 11 + 2.3);
      if (nt > 0) { ctx.globalAlpha = fade * nt; const tx = gx2(ch.mark[0]), ty = gy2(ch.mark[1]); ctx.fillStyle = hexA('#000000', .65); ctx.beginPath(); ctx.roundRect(ch.x0 + 6, ty - 130, w - 12, 76, 14); ctx.fill(); text(ch.note, ch.x0 + w / 2, ty - 92, { size: 22, weight: 700, align: 'center', color: '#fff' });
        ctx.strokeStyle = C.brandXl; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, ty - 52); ctx.lineTo(tx, ty - 10); ctx.stroke(); ctx.globalAlpha = fade; }
    });
    text(c < 12 ? 'Enfriamos y registramos la temperatura' : 'Plateau frente a cambio de pendiente', 120, 650, { size: 34, weight: 800, color: C.brand });
    text('Aleación: mezcla cristalina de dos metales', 120, 700, { size: 26, weight: 600, alpha: .85 });
    text('Metal puro: temperatura de fusión fija', 120, 744, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }

  /* ================= modo construir (curvas → diagrama) ================= */
  const COMPS = DIAG === 'iso' ? [0, 25, 50, 75, 100] : [0, 10, 40, 62, 80];
  function simulate(x) {
    const T0 = Math.max(...[0, 25, 50, 75, 100].map(D.top)) + 80, Tend = D.tMin + 60, pts = [], ev = [];
    let T = T0, t = 0, key = 'L', inv = D.inv(x), invDone = false;
    const tl = D.liqd(x), ts = D.sol(x);
    pts.push([0, T]);
    while (T > Tend && t < 4000) {
      const above = T > tl + .01, mid = T > ts + .01 && !above, rate = above ? 3.5 : mid ? .7 : 3.5;
      if (inv && !invDone && T <= inv[0] + .01 && (x < .5 || x > 99.5 || T <= ts + .1 || (DIAG !== 'iso'))) { if (T <= inv[0] + .01) { ev.push({ t, x, T: inv[0], k: 'e' }); const h = inv[1]; t += h; pts.push([t, inv[0]]); invDone = true; T = inv[0] - 1; continue; } }
      if (key === 'L' && T <= tl && !(x < .5 || x > 99.5)) { ev.push({ t, x, T: tl, k: 'l' }); key = 'm'; }
      if (key === 'm' && T <= ts && !inv) { ev.push({ t, x, T: ts, k: 's' }); key = 's'; }
      T -= rate; t += 1; if (t % 6 === 0) pts.push([t, T]);
    }
    pts.push([t, T]);
    return { pts, ev, T0 };
  }
  let SIM = null;
  function modoConstruir(c) {
    if (!SIM) { SIM = COMPS.map(simulate); SIM.tmax = Math.max(...SIM.map(s => s.pts[s.pts.length - 1][0])); }
    const fade = c > 21.4 ? clamp(1 - (c - 21.4) / .6) : 1; ctx.globalAlpha = fade;
    const CX0 = 970, CX1 = 1340, DXa = 1450, DXb = 1780, p = ph(c, 1.2, 15), tNow = p * SIM.tmax;
    const gy2 = T => DY1 - (T - D.tMin) / (D.tMax - D.tMin) * (DY1 - DY0), gxT = t => CX0 + t / SIM.tmax * (CX1 - CX0), gxD = x => DXa + x / 100 * (DXb - DXa);
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(CX0, DY0 - 10); ctx.lineTo(CX0, DY1); ctx.lineTo(CX1 + 10, DY1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(DXa, DY0 - 10); ctx.lineTo(DXa, DY1); ctx.lineTo(DXb + 10, DY1); ctx.stroke();
    text('Temperatura', CX0 - 6, DY0 - 24, { size: 22, weight: 700, alpha: .8 }); text('Tiempo', CX1, DY1 + 42, { size: 22, weight: 700, align: 'right', alpha: .8 });
    text('A', DXa, DY1 + 42, { size: 26, weight: 800, align: 'center', color: BLUE }); text('B', DXb, DY1 + 42, { size: 26, weight: 800, align: 'center', color: GRN }); text('% B', (DXa + DXb) / 2, DY1 + 42, { size: 22, weight: 700, align: 'center', alpha: .7 });
    const pal = [BLUE, '#5fd0d0', C.brand, '#ff7ab6', GRN];
    SIM.forEach((s, k) => {
      ctx.strokeStyle = pal[k]; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); let started = false;
      for (const [t, T] of s.pts) { if (t > tNow) break; started ? ctx.lineTo(gxT(t), gy2(T)) : ctx.moveTo(gxT(t), gy2(T)); started = true; }
      ctx.stroke();
      text(['I', 'II', 'III', 'IV', 'V'][k], gxT(s.pts[s.pts.length - 1][0]) + 14, gy2(D.tMin + 60) - 8, { size: 20, weight: 800, color: pal[k], alpha: p >= 1 ? 1 : 0 });
      s.ev.forEach(e => {
        if (tNow < e.t) return; const a = clamp((tNow - e.t) / (SIM.tmax * .03));
        const yy = gy2(e.T); ctx.strokeStyle = hexA(C.fg, .3 * a); ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gxT(e.t), yy); ctx.lineTo(gxD(COMPS[k]), yy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = e.k === 'l' ? C.brandXl : e.k === 'e' ? '#ffffff' : '#7cc4ff'; ctx.beginPath(); ctx.arc(gxT(e.t), yy, 7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(gxD(COMPS[k]), yy, 9, 0, TAU); ctx.fill();
      });
      text(fmt(COMPS[k], 0) + '%', gxD(COMPS[k]), DY0 - 6, { size: 18, weight: 800, align: 'center', color: pal[k] });
      ctx.strokeStyle = hexA(pal[k], .25); ctx.lineWidth = 2; ctx.setLineDash([3, 8]); ctx.beginPath(); ctx.moveTo(gxD(COMPS[k]), DY0); ctx.lineTo(gxD(COMPS[k]), DY1); ctx.stroke(); ctx.setLineDash([]);
    });
    // unir los puntos: se dibujan las líneas del diagrama
    const jn = ph(c, 15.5, 19);
    if (jn > 0) {
      ctx.globalAlpha = fade * jn;
      D.lines.forEach(l => { ctx.strokeStyle = l.col; ctx.lineWidth = 6; ctx.beginPath(); let on = false; if (l.f) for (let x = 0; x <= 100.001; x += 1) { const T = l.f(x); if (T === null) { on = false; continue; } on ? ctx.lineTo(gxD(x), gy2(T)) : ctx.moveTo(gxD(x), gy2(T)); on = true; } if (l.fy) for (let T = D.tMin; T <= D.te + .1; T += 5) { const x = l.fy(T); x === null ? (on = false) : (on ? ctx.lineTo(gxD(x), gy2(T)) : ctx.moveTo(gxD(x), gy2(T))); on = true; } ctx.stroke(); });
      D.zones.forEach(([x, T, n]) => text(n, gxD(x), gy2(T), { size: 26, weight: 800, align: 'center', alpha: .85 }));
      ctx.globalAlpha = fade;
    }
    text(c < 15 ? 'Cada curva es una composición distinta' : 'Unimos los puntos de cambio: nace el diagrama', 120, 650, { size: 32, weight: 800, color: C.brand });
    text('Los cambios de pendiente y las mesetas', 120, 700, { size: 26, weight: 600, alpha: .85 });
    text('marcan las líneas de liquidus y de solidus', 120, 742, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }

  /* ================= modo explorar ================= */
  const SEQ = params.secuencia || (DIAG === 'iso' ? [50] : [30, 62, 80]);
  const PAUSA = params.pausa || null, SEGT = 14;
  function modoExplorar(c, t, dt) {
    const inside = pointer.x > DX0 - 20 && pointer.x < DX1 + 20 && pointer.y > DY0 - 20 && pointer.y < DY1 + 20;
    let x, T, auto = !inside;
    if (inside) { x = clamp((pointer.x - DX0) / (DX1 - DX0) * 100, .5, 99.5); T = D.tMin + (DY1 - pointer.y) / (DY1 - DY0) * (D.tMax - D.tMin); T = clamp(T, D.tMin, D.tMax); }
    else {
      const seg = api.static ? 0 : Math.floor(c / SEGT) % SEQ.length, cc = api.static ? 8.5 : c % SEGT; x = SEQ[seg];
      const Ts = D.tMax - 40, Te = D.tMin + 40; let u;
      if (PAUSA) { const hold = PAUSA[1], tm = 5 + hold; u = cc < 5 ? ph(cc, .8, 5) * ((Ts - PAUSA[0]) / (Ts - Te)) : cc < tm ? (Ts - PAUSA[0]) / (Ts - Te) : (Ts - PAUSA[0]) / (Ts - Te) + ph(cc, tm, tm + 5) * (1 - (Ts - PAUSA[0]) / (Ts - Te)); }
      else u = ph(cc, .8, 11); T = lerp(Ts, Te, u);
    }
    drawDiagram();
    const st = D.state(x, T);
    // marcador de composición y línea de reparto
    ctx.strokeStyle = hexA(C.fg, .35); ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(gx(x), DY1); ctx.lineTo(gx(x), DY0); ctx.stroke(); ctx.setLineDash([]);
    if (st.tie) {
      const [xa, xb] = st.tie, y = gy(T);
      ctx.strokeStyle = C.brandXl; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx(xa), y); ctx.lineTo(gx(xb), y); ctx.stroke();
      [[xa, st.ph[0].col], [xb, st.ph[1].col]].forEach(([xx, col]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(gx(xx), y, 12, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); });
      // segmentos de la palanca
      ctx.lineWidth = 4; ctx.strokeStyle = st.ph[0].col; ctx.beginPath(); ctx.moveTo(gx(x), y + 26); ctx.lineTo(gx(xb), y + 26); ctx.stroke(); ctx.strokeStyle = st.ph[1].col; ctx.beginPath(); ctx.moveTo(gx(xa), y + 26); ctx.lineTo(gx(x), y + 26); ctx.stroke();
      text('C₀', gx(x), y - 22, { size: 22, weight: 800, align: 'center' });
    }
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 24; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gx(x), gy(T), 11, 0, TAU); ctx.fill(); ctx.restore();
    // lectura
    text(st.name, 120, 530, { size: 34, weight: 800, color: C.brand });
    text('Composición C₀ = ' + fmt(x, 0) + ' % B', 120, 574, { size: 24, weight: 700, alpha: .85 });
    micro(300, 760, 130, st.micro, c);
    if (st.ph) st.ph.forEach((p, i) => {
      text(p.n, 480, 690 + i * 100, { size: 28, weight: 800, color: p.col === LIQ ? C.brandXl : p.col });
      text('composición: ' + fmt(p.x, p.x % 1 ? 1 : 0) + ' % B', 480, 722 + i * 100, { size: 21, weight: 600, alpha: .85 });
      text('proporción: ' + fmt(p.w * 100) + ' %', 480, 750 + i * 100, { size: 24, weight: 800 });
    });
    else text(st.name.indexOf('Líquido') === 0 ? 'Mezcla líquida homogénea' : 'Una sola fase sólida', 480, 760, { size: 24, weight: 700, alpha: .85 });
    text(auto ? 'Pasa el ratón por el diagrama para explorar' : 'Suelta el ratón para ver el enfriamiento automático', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    if (MODO === 'curvas') modoCurvas(api.static ? 14 : t % 16);
    else if (MODO === 'construir') modoConstruir(api.static ? 20 : t % 22);
    else modoExplorar(t % (SEGT * SEQ.length), t, dt);
  }
  return { frame };
});
