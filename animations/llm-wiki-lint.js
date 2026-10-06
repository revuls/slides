/* LLM Wiki — "Lint": el wiki se revisa y se autocorrige.
   Un escáner recorre el grafo, marca 4 tipos de problema (enlace roto, contradicción,
   página huérfana, afirmación obsoleta) y después el LLM los corrige. Ciclo de 14 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, ease, TAU } = api;
  const CYC = 14, RED = '#E5384A', OK = '#14A05A';

  const P = [
    ['Transformers', 960, 410], ['Atención', 1320, 470], ['GPT', 1511, 617], ['Tokens', 1445, 785],
    ['RAG', 1151, 895], ['Embeddings', 769, 895], ['Agentes', 475, 785], ['Evaluación', 409, 617], ['Seguridad', 600, 470]
  ].map(([n, x, y]) => ({ n, x, y }));
  const E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [8, 0], [0, 5], [1, 4], [2, 4], [6, 8]];
  const orphanEdges = [[6, 7], [7, 8]];
  const GHOST = { n: 'Reranking', x: 1700, y: 905 };

  // problemas: x donde se detectan, instante de corrección
  const issues = [
    { id: 'huerfana', x: P[7].x, fix: 6.6 },
    { id: 'obsoleta', x: P[8].x, fix: 7.6 },
    { id: 'enlace', x: GHOST.x, fix: 8.6 },
    { id: 'contradiccion', x: (P[2].x + P[3].x) / 2, fix: 9.6 }
  ];
  const SCAN0 = .8, SCAN1 = 5.2, XA = 250, XB = 1760;
  issues.forEach(it => { it.det = SCAN0 + (it.x - XA) / (XB - XA) * (SCAN1 - SCAN0); });
  const st = (it, c) => c < it.det ? 0 : c < it.fix ? 1 : 2;            // 0 normal · 1 detectado · 2 corregido
  const prog = (it, c) => clamp((c - it.fix) / .9);

  function page(x, y, col, a, label) {
    const k = 1.35;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = hexA(C.fg, .08); ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - 26 * k, y - 33 * k, 52 * k, 66 * k, 9 * k); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = hexA(C.fg, .45);
    for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(x - 14 * k, y - 14 * k + l * 14 * k); ctx.lineTo(x + 14 * k, y - 14 * k + l * 14 * k); ctx.stroke(); }
    ctx.restore();
    text(label, x, y + 92, { size: 26, weight: 600, align: 'center', alpha: .85 * a });
  }
  const tag = (txt, x, y, col, a = 1) => {
    ctx.save(); ctx.globalAlpha = a; ctx.font = "700 22px 'Inter',sans-serif"; const w = ctx.measureText(txt).width + 36;
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 18, w, 36, 18); ctx.fill(); ctx.restore();
    text(txt, x, y, { size: 22, weight: 700, align: 'center', base: 'middle', color: '#fff', alpha: a });
  };
  const line = (a, b, col, w, dash, al = 1) => { ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); };

  function frame(dt, t) {
    const c = api.static ? 5.6 : t % CYC;
    const out = c > 13.2 ? clamp(1 - (c - 13.2) / .8) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = out;
    const S = Object.fromEntries(issues.map(it => [it.id, { s: st(it, c), p: prog(it, c) }]));

    // aristas normales
    E.forEach(([i, j]) => line(P[i], P[j], hexA(C.fg, .3), 2.5));
    // huérfana: sus enlaces aparecen al corregir
    orphanEdges.forEach(([i, j]) => { if (S.huerfana.s === 2) { const a = P[i], b = P[j], p = ease(S.huerfana.p); line(a, { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p }, C.brand, 3.5); } });
    // enlace roto → página fantasma
    const e = S.enlace;
    if (e.s >= 1 || c > 3) {
      const col = e.s === 2 ? C.brand : RED, a = Math.min(1, Math.max(0, (c - (issues[2].det - .3)) / .4));
      line(P[4], GHOST, col, e.s === 2 ? 3.5 : 3, e.s === 2 ? [] : [14, 10], a);
      if (e.s === 1) { tag('enlace roto', 1440, 920, RED, a); text('✕', GHOST.x, GHOST.y, { size: 54, weight: 800, align: 'center', base: 'middle', color: RED, alpha: a }); }
      if (e.s === 2) page(GHOST.x, GHOST.y, C.brand, ease(e.p), GHOST.n);
    }

    // páginas
    P.forEach((p, i) => {
      let col = hexA(C.fg, .55);
      if (i === 7) col = S.huerfana.s === 1 ? RED : S.huerfana.s === 2 ? C.brand : hexA(C.fg, .35);
      if (i === 8) col = S.obsoleta.s === 1 ? '#E0A100' : S.obsoleta.s === 2 ? C.brand : hexA(C.fg, .55);
      if ((i === 2 || i === 3)) col = S.contradiccion.s === 1 ? RED : S.contradiccion.s === 2 ? C.brand : hexA(C.fg, .55);
      page(p.x, p.y, col, i === 7 && S.huerfana.s === 0 ? .5 : 1, p.n);
    });
    if (S.huerfana.s === 1) tag('huérfana', P[7].x, P[7].y - 90, RED);
    if (S.obsoleta.s === 1) tag('obsoleta', P[8].x, P[8].y - 90, '#E0A100');
    if (S.obsoleta.s === 2) tag('actualizada', P[8].x, P[8].y - 90, OK, S.obsoleta.p);
    if (S.huerfana.s === 2) tag('conectada', P[7].x, P[7].y - 90, OK, S.huerfana.p);
    if (S.enlace.s === 2) tag('enlace creado', GHOST.x, GHOST.y - 90, OK, S.enlace.p);
    const mid = { x: (P[2].x + P[3].x) / 2 + 170, y: (P[2].y + P[3].y) / 2 };
    if (S.contradiccion.s === 1) { text('≠', mid.x, mid.y - 22, { size: 64, weight: 800, align: 'center', base: 'middle', color: RED }); tag('contradicción', mid.x, mid.y + 38, RED); }
    if (S.contradiccion.s === 2) { text('=', mid.x, mid.y - 22, { size: 64, weight: 800, align: 'center', base: 'middle', color: OK, alpha: S.contradiccion.p }); tag('reconciliadas', mid.x, mid.y + 38, OK, S.contradiccion.p); }

    // escáner
    if (c > SCAN0 - .3 && c < SCAN1 + .6) {
      const x = XA + clamp((c - SCAN0) / (SCAN1 - SCAN0)) * (XB - XA), g = ctx.createLinearGradient(x - 160, 0, x, 0);
      g.addColorStop(0, hexA(C.brand, 0)); g.addColorStop(1, hexA(C.brand, .35));
      ctx.fillStyle = g; ctx.fillRect(x - 160, 330, 160, 640);
      ctx.fillStyle = C.brand; ctx.fillRect(x - 2, 330, 4, 640);
    }

    // marcador de estado
    const open = Object.values(S).filter(v => v.s === 1).length, fixed = Object.values(S).filter(v => v.s === 2 && v.p >= 1).length;
    const healthy = fixed === 4;
    text(healthy ? 'Wiki sano' : c < SCAN1 + .6 ? 'Escaneando…' : 'Corrigiendo…', W - 120, 190, { size: 34, weight: 800, align: 'right', color: healthy ? OK : C.brand });
    text(`Problemas abiertos: ${open}`, W - 120, 236, { size: 28, weight: 600, align: 'right', alpha: .85 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
