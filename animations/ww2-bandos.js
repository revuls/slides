/* Segunda Guerra Mundial — Cómo se formaron los bandos (1939–1945).
   Los países salen de la zona "sin bando" y se unen a Aliados o Eje en su fecha; algunos cambian de bando.
   Ciclo de 23 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, TAU } = api;
  const CYC = 23, Y0 = 1939.0, Y1 = 1945.7, DUR = 18;
  // [abrev, nombre, bando inicial (A/E), fecha de entrada, fecha de cambio de bando]
  const LIST = [
    ['ALE', 'Alemania', 'E', 1939.0], ['CHN', 'China', 'A', 1939.0], ['POL', 'Polonia', 'A', 1939.67],
    ['GBR', 'Reino Unido', 'A', 1939.67], ['FRA', 'Francia', 'A', 1939.67], ['AUS', 'Australia', 'A', 1939.67],
    ['CAN', 'Canadá', 'A', 1939.7], ['ITA', 'Italia', 'E', 1940.44, 1943.78], ['JPN', 'Japón', 'E', 1940.72],
    ['HUN', 'Hungría', 'E', 1940.85], ['RUM', 'Rumanía', 'E', 1940.9, 1944.65], ['BUL', 'Bulgaria', 'E', 1941.2, 1944.7],
    ['URSS', 'URSS', 'A', 1941.47], ['EEUU', 'EE. UU.', 'A', 1941.93], ['BRA', 'Brasil', 'A', 1942.65]
  ].map(([ab, n, s, t, sw], i) => ({ ab, n, i, ev: [{ t, s }, ...(sw ? [{ t: sw, s: s === 'E' ? 'A' : 'E' }] : [])], x: 0, y: 0, r: 30, flash: 0, last: null, init: false }));
  const EVENTS = [
    [1939.67, '1 sep 1939 · Alemania invade Polonia'], [1940.44, 'Jun 1940 · Italia entra en la guerra'],
    [1941.47, '22 jun 1941 · Alemania invade la URSS'], [1941.93, '7 dic 1941 · Pearl Harbor: EE. UU. entra en la guerra'],
    [1943.78, 'Oct 1943 · Italia cambia de bando'], [1944.7, 'Ago–sep 1944 · Rumanía y Bulgaria cambian de bando'],
    [1945.35, '8 may 1945 · Alemania se rinde']
  ];
  const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const SLOT = { A: { x: 360, y: 490 }, E: { x: 1130, y: 490 } }, DX = 150, DY = 125;
  const BX0 = 560, BX1 = 1700, BY = 1000;
  const col = s => s === 'A' ? C.brand : C.sec;
  let prev = 0;

  const sideAt = (c, year) => { let s = null, ts = 0; for (const e of c.ev) if (year >= e.t) { s = e.s; ts = e.t; } return { s, ts }; };

  function frame(dt, t) {
    const c = api.static ? 20 : t % CYC;
    if (c < prev - 1) LIST.forEach(k => { k.init = false; k.last = null; k.flash = 0; });
    prev = c;
    const prog = api.static ? 1 : clamp(c / DUR), year = Y0 + (Y1 - Y0) * prog;
    const fade = c > 22.2 ? clamp(1 - (c - 22.2) / .8) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // estado y objetivo de cada país
    const st = LIST.map(k => sideAt(k, year));
    const rank = { A: [], E: [] };
    LIST.forEach((k, i) => { if (st[i].s) rank[st[i].s].push(i); });
    ['A', 'E'].forEach(s => rank[s].sort((a, b) => st[a].ts - st[b].ts || a - b));
    LIST.forEach((k, i) => {
      const s = st[i].s; let tx, ty, tr;
      if (!s) { tx = 250 + i * (1420 / 14); ty = 905; tr = 30; }
      else { const j = rank[s].indexOf(i); tx = SLOT[s].x + (j % 4) * DX; ty = SLOT[s].y + Math.floor(j / 4) * DY; tr = 44; }
      if (k.last !== s) { if (k.init && s) k.flash = 1; k.last = s; }
      if (!k.init || api.static) { k.x = tx; k.y = ty; k.r = tr; k.init = true; }
      else { const f = 1 - Math.exp(-dt * 5); k.x += (tx - k.x) * f; k.y += (ty - k.y) * f; k.r += (tr - k.r) * f; }
      k.flash = Math.max(0, k.flash - dt * 1.3);
    });
    const nA = rank.A.length, nE = rank.E.length;

    // paneles
    [['A', 290, 'ALIADOS', nA], ['E', 1060, 'EJE', nE]].forEach(([s, x, lb, n]) => {
      ctx.fillStyle = hexA(col(s), .07); ctx.strokeStyle = hexA(col(s), .4); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x, 440, 590, 400, 28); ctx.fill(); ctx.stroke();
      text(`${lb} · ${n}`, x + 295, 405, { size: 36, weight: 800, align: 'center', color: col(s) });
    });
    if (LIST.some(k => !k.last)) text('Países aún sin bando', 250, 858, { size: 24, weight: 600, alpha: .6 });

    // países
    LIST.forEach(k => {
      const s = k.last, cc = s ? col(s) : C.fg;
      ctx.save();
      if (k.flash > 0) { ctx.strokeStyle = hexA(cc, k.flash); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(k.x, k.y, k.r + (1 - k.flash) * 46, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = s ? hexA(cc, .3) : hexA(C.fg, .08); ctx.strokeStyle = s ? cc : hexA(C.fg, .4); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      text(k.ab, k.x, k.y, { size: s ? 26 : 20, weight: 800, align: 'center', base: 'middle', alpha: s ? 1 : .7 });
      if (s) text(k.n, k.x, k.y + k.r + 28, { size: 22, weight: 600, align: 'center', alpha: .9 });
    });

    // fecha y evento actual
    text(`${MES[Math.min(11, Math.floor((year % 1) * 12))]} ${Math.floor(year)}`, W - 120, 205, { size: 96, weight: 800, align: 'right', color: C.brand });
    const ev = EVENTS.filter(e => year >= e[0]).pop();
    if (ev) text(ev[1], W - 120, 270, { size: 28, weight: 600, align: 'right', alpha: .9 });

    // línea de tiempo
    const X = y => BX0 + (y - Y0) / (Y1 - Y0) * (BX1 - BX0);
    ctx.fillStyle = hexA(C.fg, .2); ctx.fillRect(BX0, BY - 3, BX1 - BX0, 6);
    ctx.fillStyle = C.brand; ctx.fillRect(BX0, BY - 3, X(year) - BX0, 6);
    for (let y = 1939; y <= 1945; y++) { text(String(y), X(y), BY - 22, { size: 22, weight: 600, align: 'center', alpha: .6 }); ctx.fillStyle = hexA(C.fg, .35); ctx.fillRect(X(y) - 1, BY - 9, 2, 18); }
    EVENTS.forEach(e => { ctx.fillStyle = year >= e[0] ? C.brandXl : hexA(C.fg, .4); ctx.beginPath(); ctx.arc(X(e[0]), BY, 8, 0, TAU); ctx.fill(); });
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 20; ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(X(year), BY, 13, 0, TAU); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 1;
  }
  return { frame };
});
