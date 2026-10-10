/* Electricidad — Transformador monofásico (Vs / Vp = Ns / Np).
   Reductor: 230 V con Np = 1000 y Ns = 50 vueltas → ≈ 11,5 V. Elevador: el mismo transformador al revés → 230 V.
   El flujo magnético alterno del núcleo (puntos ámbar) induce la tensión del secundario. Esquema: nº de espiras y amplitudes sin escala.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const TAU = Math.PI * 2, AMB = '#ffd54a', ORG = '#ff8a4c', GRN = '#5fd08a';
  const CYC = 16, PER = 2.5;                                       // ciclo de la red animado a 2,5 s
  const LX = 940, RX = 1420, CT = 430, CB = 850;                   // patas del núcleo y barras
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const line = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
  // recorrido del flujo por el centro del núcleo
  const P = [[LX, 480], [RX, 480], [RX, 800], [LX, 800]], cum = [0];
  const PP = [...P, P[0]]; for (let i = 1; i < PP.length; i++) cum.push(cum[i - 1] + Math.hypot(PP[i][0] - PP[i - 1][0], PP[i][1] - PP[i - 1][1]));
  const PL = cum[cum.length - 1];
  const at = d => { d = ((d % PL) + PL) % PL; let i = 1; while (cum[i] < d) i++; const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1]); return [PP[i - 1][0] + (PP[i][0] - PP[i - 1][0]) * f, PP[i - 1][1] + (PP[i][1] - PP[i - 1][1]) * f]; };
  const coil = (xc, n, col, a) => {
    const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * a; ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const y = 560 + 160 * i / (n - 1); line([[xc - 92, y + 6], [xc, y - 6], [xc + 92, y + 6]]); }
    ctx.globalAlpha = g0;
  };

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 4) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const B = ph(c, 7.6, 8.4), A = 1 - B;                            // A: reductor · B: elevador
    const phi = (c / PER) * TAU;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- núcleo ----
    ctx.beginPath(); ctx.roundRect(880, CT, 600, CB - CT, 26); ctx.roundRect(1000, 530, 360, 220, 10);
    ctx.fillStyle = hexA(C.fg, .14); ctx.fill('evenodd'); ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 4; ctx.stroke();
    text('Núcleo de hierro', (LX + RX) / 2, 646, { size: 26, weight: 700, align: 'center', alpha: .6 });
    // flujo alterno
    const off = -150 * Math.cos(phi), N = Math.round(PL / 52), sp = PL / N;
    for (let i = 0; i < N; i++) { const [x, y] = at(i * sp + off); ctx.fillStyle = hexA(AMB, .95); ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); }
    text('Flujo magnético alterno', (LX + RX) / 2, 462, { size: 24, weight: 800, align: 'center', color: AMB });

    // ---- bobinas ----
    coil(LX, 12, ORG, A); coil(LX, 3, ORG, B); coil(RX, 3, GRN, A); coil(RX, 12, GRN, B);
    // ---- fuente y receptor ----
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 8;
    line([[700, 592], [700, 560], [LX - 92, 566]]); line([[700, 688], [700, 720], [LX - 92, 726]]);
    line([[RX + 92, 566], [1700, 560], [1700, 592]]); line([[RX + 92, 726], [1700, 720], [1700, 688]]);
    ctx.strokeStyle = C.fg; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(700, 640, 48, 0, TAU); ctx.stroke();
    ctx.strokeStyle = C.brand; ctx.lineWidth = 6; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = 676 + 48 * i / 40, y = 640 - 16 * Math.sin(i / 40 * TAU); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const lit = .5 + .5 * Math.abs(Math.sin(phi));
    const g = ctx.createRadialGradient(1700, 640, 0, 1700, 640, 130); g.addColorStop(0, hexA(AMB, .45 * lit)); g.addColorStop(1, hexA(AMB, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(1700, 640, 130, 0, TAU); ctx.fill();
    ctx.fillStyle = hexA(AMB, .15 + .55 * lit); ctx.beginPath(); ctx.arc(1700, 640, 48, 0, TAU); ctx.fill(); ctx.strokeStyle = C.fg; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(1700, 640, 48, 0, TAU); ctx.stroke();
    text('Red', 700, 722 + 44, { size: 26, weight: 700, align: 'center', alpha: .8 }); text('Receptor', 1700, 722 + 44, { size: 26, weight: 700, align: 'center', alpha: .8 });
    const volt = (txt1, txt2, x, y, col) => { ctx.globalAlpha = fade * A; text(txt1, x, y, { size: 36, weight: 800, align: 'center', color: col }); ctx.globalAlpha = fade * B; text(txt2, x, y, { size: 36, weight: 800, align: 'center', color: col }); ctx.globalAlpha = fade; };
    volt('230 V', '≈ 11,5 V', 700, 560 - 42, ORG); volt('≈ 11,5 V', '230 V', 1700, 560 - 42, GRN);

    // ---- rótulos de las bobinas ----
    const lab = (txtA, txtB, x, y, col, size) => { ctx.globalAlpha = fade * A; text(txtA, x, y, { size, weight: 800, align: 'center', color: col }); ctx.globalAlpha = fade * B; text(txtB, x, y, { size, weight: 800, align: 'center', color: col }); ctx.globalAlpha = fade; };
    text('Primario', LX, 388, { size: 28, weight: 800, align: 'center', color: ORG }); text('Secundario', RX, 388, { size: 28, weight: 800, align: 'center', color: GRN });
    lab('Np = 1000 vueltas', 'Np = 50 vueltas', LX, 418, ORG, 24); lab('Ns = 50 vueltas', 'Ns = 1000 vueltas', RX, 418, GRN, 24);

    // ---- fórmula ----
    text('Vs / Vp = Ns / Np', 1360, 250, { size: 50, weight: 800, align: 'center', color: C.brand });
    lab('230 V · 50 / 1000 ≈ 11,5 V', '11,5 V · 1000 / 50 = 230 V', 1360, 302, C.fg, 32);

    // ---- ondas (sin escala) ----
    const wave = (x0, x1, y, ampA, ampB, col) => {
      const amp = ampA * A + ampB * B; ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2; line([[x0, y], [x1, y]]);
      ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); for (let i = 0; i <= 90; i++) { const x = x0 + (x1 - x0) * i / 90, v = y - amp * Math.sin(i / 90 * 2 * TAU - phi); i ? ctx.lineTo(x, v) : ctx.moveTo(x, v); } ctx.stroke();
    };
    wave(900, 1180, 930, 34, 11, ORG); wave(1280, 1560, 930, 11, 34, GRN);
    text('tensión en el primario', 1040, 986, { size: 22, weight: 600, align: 'center', alpha: .7 }); text('tensión en el secundario', 1420, 986, { size: 22, weight: 600, align: 'center', alpha: .7 });

    // ---- mensaje ----
    ctx.globalAlpha = fade * A; text('Reductor: baja la tensión', 120, 940, { size: 34, weight: 800, color: C.brand }); text('Menos vueltas en el secundario que en el primario', 120, 984, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = fade * B; text('Elevador: sube la tensión', 120, 940, { size: 34, weight: 800, color: C.brand }); text('Más vueltas en el secundario que en el primario', 120, 984, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
