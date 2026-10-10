/* Materiales — Ensayo de tracción de un acero: probeta + diagrama σ-ε con sus zonas.
   params.vista: 'curva' (por defecto: mueve el ratón sobre el diagrama para estirar la probeta),
                 'fluencia' (zoom narrativo al fenómeno de fluencia),
                 'probeta' (la máquina de ensayos y la rotura con estricción).
   La curva es ILUSTRATIVA (forma cualitativa de un acero dulce), no datos medidos. Ciclo ≈ 24 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const VISTA = params.vista || 'curva';
  const BLUE = '#4aa3ff', AMB = '#ffc24a';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const XP = .08, XE = .10, XF = .24, XR = .62, XS = .88;
  // tensión normalizada (0..1) para una deformación x (0..XS)
  function sg(x) {
    if (x <= XP) return .52 * x / XP;
    if (x <= XE) return .52 + .06 * Math.pow((x - XP) / (XE - XP), .8);
    if (x <= XF) return .575 + .025 * Math.sin((x - XE) / (XF - XE) * TAU * 3.5) * (1 - (x - XE) / (XF - XE) * .3);
    if (x <= XR) { const u = (x - XF) / (XR - XF); return .57 + .43 * (1 - Math.pow(1 - u, 2)); }
    const u = clamp((x - XR) / (XS - XR)); return 1 - .22 * u * u;
  }
  const ZONES = [
    [XP, 'Zona de proporcionalidad elástica (0–P)', BLUE, 'σ y ε son proporcionales: ley de Hooke'],
    [XE, 'Zona elástica no proporcional (P–E)', BLUE, 'Aún recupera la forma, pero ya no es lineal'],
    [XF, 'Fluencia (E–F)', AMB, 'Se alarga sin aumentar la carga'],
    [XR, 'Deformación plástica uniforme (F–R)', C.brand, 'La probeta se alarga por igual en toda su longitud'],
    [9, 'Deformación plástica localizada (R–S)', C.brandXl, 'Estricción: el cuello se estrecha hasta romper']
  ];
  const zoneOf = x => ZONES.find(z => x <= z[0]) || ZONES[4];

  // geometría de la gráfica
  const big = VISTA !== 'probeta';
  const PX0 = big ? 1000 : 1430, PX1 = big ? 1780 : 1800, PY0 = big ? 190 : 330, PY1 = big ? 830 : 760;
  const gx = x => PX0 + x / 1 * (PX1 - PX0), gy = s => PY1 - s * (PY1 - PY0) * .9;

  /* probeta en coordenadas locales: eje x = longitud, centrada en (0,0) */
  function specimen(x, scale, broken) {
    const L0 = 400, W0 = 56, HEAD = 100, e = 1 + Math.min(x, XS) * .5;
    const neck = x > XR ? ease(clamp((x - XR) / (XS - XR))) : 0;
    const gauge = L0 * e, hl = 70;
    const wAt = u => { const base = W0 * (1 - .14 * clamp(x / XR)); return base * (1 - .62 * neck * Math.exp(-Math.pow((u - .5) / .12, 2))); };
    const gap = broken ? 46 : 0;
    ctx.save(); ctx.scale(scale, scale);
    const fillSeg = (a, b) => {
      const N = 36; const g = ctx.createLinearGradient(0, -HEAD / 2, 0, HEAD / 2); g.addColorStop(0, mix(C.brand, '#ffffff', .4)); g.addColorStop(.5, C.brand); g.addColorStop(1, mix(C.brand, '#000000', .35));
      ctx.fillStyle = g; ctx.beginPath();
      for (let i = 0; i <= N; i++) { const u = a + (b - a) * i / N, xx = -gauge / 2 + u * gauge + (u < .5 ? -gap / 2 : gap / 2); i ? ctx.lineTo(xx, -wAt(u) / 2) : ctx.moveTo(xx, -wAt(u) / 2); }
      for (let i = N; i >= 0; i--) { const u = a + (b - a) * i / N, xx = -gauge / 2 + u * gauge + (u < .5 ? -gap / 2 : gap / 2); ctx.lineTo(xx, wAt(u) / 2); }
      ctx.closePath(); ctx.fill();
    };
    // cabezas de sujeción
    ctx.fillStyle = mix(C.brand, '#000000', .2);
    ctx.fillRect(-gauge / 2 - hl - gap / 2, -HEAD / 2, hl, HEAD); ctx.fillRect(gauge / 2 + gap / 2, -HEAD / 2, hl, HEAD);
    if (broken) { fillSeg(0, .5); fillSeg(.5, 1); } else fillSeg(0, 1);
    // marcas de la longitud base l0
    ctx.strokeStyle = hexA('#000000', .4); ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { const u = .1 + i * .1; if (broken && Math.abs(u - .5) < .06) continue; const xx = -gauge / 2 + u * gauge + (u < .5 ? -gap / 2 : gap / 2); ctx.beginPath(); ctx.moveTo(xx, -wAt(u) / 2 + 3); ctx.lineTo(xx, wAt(u) / 2 - 3); ctx.stroke(); }
    ctx.restore();
    return { half: gauge / 2 + hl };
  }

  function arrowsAt(s, half, scale) {
    if (s < .03) return;
    const al = (30 + s * 90) * scale, y = 0;
    [-1, 1].forEach(sd => {
      const x1 = sd * (half * scale + 14), x2 = x1 + sd * al;
      ctx.strokeStyle = C.brandXl; ctx.fillStyle = C.brandXl; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 - sd * 6, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2 + sd * 24, y); ctx.lineTo(x2, y - 20); ctx.lineTo(x2, y + 20); ctx.closePath(); ctx.fill();
    });
  }

  function plot(x, show) {
    // bandas de zona
    [[0, XE, BLUE, 'ELÁSTICA'], [XE, XR, C.brand, 'PLÁSTICA UNIFORME'], [XR, XS, C.brandXl, 'LOCALIZADA']].forEach(([a, b, col, n]) => {
      ctx.fillStyle = hexA(col, .1); ctx.fillRect(gx(a), PY0, gx(b) - gx(a), PY1 - PY0);
      if (big) text(n, (gx(a) + gx(b)) / 2, PY0 + 28, { size: big ? 20 : 15, weight: 800, align: 'center', color: col, alpha: .9 });
    });
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX0, PY0 - 10); ctx.lineTo(PX0, PY1); ctx.lineTo(PX1 + 10, PY1); ctx.stroke();
    text('σ', PX0 - 16, PY0 + 14, { size: 34, weight: 800, align: 'right' }); text('ε', PX1 + 4, PY1 + 44, { size: 34, weight: 800, align: 'right' });
    // curva completa tenue y curva recorrida
    const N = 220; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = hexA(C.fg, .22); ctx.setLineDash([2, 10]); ctx.beginPath();
    for (let i = 0; i <= N; i++) { const xx = XS * i / N; i ? ctx.lineTo(gx(xx), gy(sg(xx))) : ctx.moveTo(gx(xx), gy(sg(xx))); } ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = C.brand; ctx.lineWidth = 7; ctx.beginPath();
    const M = Math.max(2, Math.floor(N * Math.min(x, XS) / XS));
    for (let i = 0; i <= M; i++) { const xx = Math.min(x, XS) * i / M; i ? ctx.lineTo(gx(xx), gy(sg(xx))) : ctx.moveTo(gx(xx), gy(sg(xx))); } ctx.stroke();
    // puntos notables
    [['P', XP], ['E', XE], ['F', XF], ['R', XR], ['S', XS]].forEach(([n, xx]) => {
      const px = gx(xx), py = gy(sg(xx)), hit = x >= xx - .003;
      ctx.fillStyle = hit ? C.brandXl : hexA(C.fg, .4); ctx.beginPath(); ctx.arc(px, py, hit ? 9 : 6, 0, TAU); ctx.fill();
      text(n, px + (n === 'S' ? 20 : n === 'R' ? 0 : -18), py + (n === 'R' ? -22 : n === 'S' ? 10 : 30), { size: big ? 30 : 22, weight: 800, align: 'center', alpha: hit ? 1 : .55 });
    });
    const cx = gx(Math.min(x, XS)), cy = gy(sg(Math.min(x, XS)));
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 28; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, TAU); ctx.fill(); ctx.restore();
    if (VISTA === 'fluencia') {
      const yF = gy(.575); ctx.strokeStyle = AMB; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(PX0, yF); ctx.lineTo(gx(XF) + 40, yF); ctx.stroke(); ctx.setLineDash([]);
      text('σF', PX0 - 16, yF + 10, { size: 30, weight: 800, align: 'right', color: AMB });
    }
  }

  let lastIn = false, hold = 0;
  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    const inside = pointer.x > PX0 - 40 && pointer.x < PX1 + 40 && pointer.y > PY0 - 40 && pointer.y < PY1 + 40 && VISTA === 'curva';
    let x, broken = false;
    const CYC = 24, c = api.static ? 20 : t % CYC;
    if (inside) { x = clamp((pointer.x - PX0) / (PX1 - PX0), 0, .98); hold = 3; }
    else {
      const u = VISTA === 'fluencia' ? ph(c, 1, 17) : ph(c, 1, 19);
      // más lento en la zona elástica y en la fluencia para poder verlas
      const prof = VISTA === 'fluencia' ? u * .36 : u < .2 ? u / .2 * .1 : u < .45 ? .1 + (u - .2) / .25 * .15 : .25 + (u - .45) / .55 * (XS + .01 - .25);
      x = VISTA === 'fluencia' ? prof : prof;
      if (api.static) x = VISTA === 'fluencia' ? .2 : XS + .01;
    }
    broken = x >= XS && VISTA !== 'fluencia';
    const xs = Math.min(x, XS), s = broken ? 0 : sg(xs), z = zoneOf(xs);
    const fade = !inside && c > CYC - .7 ? clamp(1 - (c - (CYC - .7)) / .7) : 1;
    ctx.globalAlpha = fade;

    if (VISTA === 'probeta') {
      // máquina: mordazas arriba y abajo, probeta vertical
      ctx.save(); ctx.translate(1130, 585); ctx.rotate(Math.PI / 2);
      const sp = specimen(xs, 1.05, broken);
      ctx.restore();
      const half = sp.half * 1.05, gyTop = 585 - half, gyBot = 585 + half;
      ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.roundRect(1130 - 120, gyTop - 100, 240, 90, 10); ctx.fill(); ctx.beginPath(); ctx.roundRect(1130 - 120, gyBot + 10, 240, 90, 10); ctx.fill();
      text('Mordaza fija', 1130, gyTop - 52, { size: 24, weight: 700, align: 'center', base: 'middle', color: '#ffffff' }); text('Mordaza móvil', 1130, gyBot + 56, { size: 24, weight: 700, align: 'center', base: 'middle', color: '#ffffff' });
      if (s > .03 && !broken) { const al = 30 + s * 70; ctx.strokeStyle = C.brandXl; ctx.fillStyle = C.brandXl; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(1130 + 150, gyBot + 55); ctx.lineTo(1130 + 150, gyBot + 55 + al); ctx.stroke(); ctx.beginPath(); ctx.moveTo(1130 + 150, gyBot + 55 + al + 24); ctx.lineTo(1130 + 130, gyBot + 55 + al); ctx.lineTo(1130 + 170, gyBot + 55 + al); ctx.closePath(); ctx.fill(); text('F', 1130 + 190, gyBot + 80 + al / 2, { size: 30, weight: 800, color: C.brandXl }); }
    } else {
      // probeta horizontal bajo el cuadro de título
      ctx.save(); ctx.translate(490, 640); const sp = specimen(xs, 1, broken); ctx.restore();
      ctx.save(); ctx.translate(490, 640); arrowsAt(s, sp.half, 1); ctx.restore();
      ctx.strokeStyle = hexA(C.fg, .4); ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(490 - 200, 585); ctx.lineTo(490 - 200, 520); ctx.moveTo(490 + 200, 585); ctx.lineTo(490 + 200, 520); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(290, 530); ctx.lineTo(690, 530); ctx.stroke();
      text('l₀', 490, 508, { size: 26, weight: 700, align: 'center', alpha: .7 });
    }
    plot(xs, true);

    // lectura
    text(broken ? 'Rotura (S)' : z[1], 120, 760, { size: VISTA === 'probeta' ? 36 : 40, weight: 800, color: broken ? C.brandXl : z[2] });
    text(broken ? 'La probeta se parte por la sección más estrecha' : z[3], 120, 808, { size: 26, weight: 600, alpha: .85 });
    if (VISTA === 'curva') {
      text('σ = F / A₀        ε = Δl / l₀', 120, 880, { size: 30, weight: 800, color: C.brand });
      text('Pasa el ratón por el diagrama para estirar la probeta', 120, 990, { size: 22, weight: 600, alpha: .5 });
    } else if (VISTA === 'fluencia') {
      text('σ = F / A₀        ε = Δl / l₀', 120, 880, { size: 30, weight: 800, color: C.brand });
    }
    ctx.globalAlpha = 1;
  }
  return { frame };
});
