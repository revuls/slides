/* Segunda Guerra Mundial — El péndulo del frente oriental (1941–1945).
   Curva ILUSTRATIVA (no son datos medidos) del territorio soviético ocupado por el Eje: avanza, alcanza su máximo
   a finales de 1942 y retrocede hasta Berlín. Ciclo de 20 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, TAU } = api;
  const CYC = 20, DRAW = 14;
  const PTS = [[1941.47, 0], [1941.6, 35], [1941.75, 70], [1941.93, 88], [1942.1, 80], [1942.45, 88], [1942.85, 100], [1943.1, 92],
    [1943.55, 85], [1943.9, 62], [1944.3, 48], [1944.55, 30], [1944.9, 20], [1945.1, 12], [1945.35, 0]];
  const T0 = 1941.47, T1 = 1945.35, XA = 260, XB = 1660, YB = 900, K = 4.3;
  const X = y => XA + (y - T0) / (T1 - T0) * (XB - XA), Y = v => YB - v * K;
  // evento: [año, valor, texto, desplazamiento y de la etiqueta]
  const EV = [[1941.47, 0, '22 jun 1941 · Barbarroja', -90], [1941.93, 88, 'Dic 1941 · Moscú frena al Eje', -72], [1942.85, 100, 'Nov 1942 · Máximo avance', -66],
    [1943.1, 92, 'Feb 1943 · Stalingrado', 118], [1943.55, 85, 'Jul 1943 · Kursk', -68], [1944.5, 30, 'Jun 1944 · Operación Bagration', -80], [1945.35, 0, 'May 1945 · Berlín', -90]];
  const val = y => { for (let i = 1; i < PTS.length; i++) if (y <= PTS[i][0]) { const [a, b] = [PTS[i - 1], PTS[i]], u = (y - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (1 - Math.cos(u * Math.PI)) / 2; } return 0; };

  function frame(dt, t) {
    const c = api.static ? 17 : t % CYC;
    const p = api.static ? 1 : clamp(c / DRAW), yr = T0 + (T1 - T0) * p, fade = c > 19.2 ? clamp(1 - (c - 19.2) / .8) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // ejes
    ctx.strokeStyle = hexA(C.fg, .25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(XA - 30, YB); ctx.lineTo(XB + 40, YB); ctx.stroke();
    for (let y = 1942; y <= 1945; y++) { ctx.beginPath(); ctx.moveTo(X(y), YB); ctx.lineTo(X(y), YB + 14); ctx.stroke(); text(String(y), X(y), YB + 46, { size: 26, weight: 600, align: 'center', alpha: .7 }); }
    text('Altura de la curva = territorio soviético ocupado por el Eje (esquema ilustrativo)', XA - 30, YB + 92, { size: 24, weight: 600, alpha: .6 });
    ctx.setLineDash([10, 12]); ctx.strokeStyle = hexA(C.fg, .15); ctx.beginPath(); ctx.moveTo(XA - 30, Y(100)); ctx.lineTo(XB + 40, Y(100)); ctx.stroke(); ctx.setLineDash([]);

    // área y curva hasta el instante actual
    const N = 240, pts = [];
    for (let i = 0; i <= N; i++) { const y = T0 + (yr - T0) * i / N; pts.push([X(y), Y(val(y))]); }
    const g = ctx.createLinearGradient(0, Y(100), 0, YB); g.addColorStop(0, hexA(C.brand, .4)); g.addColorStop(1, hexA(C.brand, 0));
    ctx.beginPath(); ctx.moveTo(pts[0][0], YB); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(pts[N][0], YB); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.strokeStyle = C.brand; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

    // eventos alcanzados
    EV.forEach(([ey, ev, label, dy]) => {
      if (yr + .01 < ey) return;
      const a = p >= 1 ? 1 : clamp((yr - ey) / .08 + .2), x = X(ey), y = Y(ev), ly = y + dy;
      ctx.save(); ctx.globalAlpha = fade * a;
      ctx.strokeStyle = hexA(C.fg, .45); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ly + (dy < 0 ? 22 : -22)); ctx.stroke();
      ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
      ctx.font = "700 26px 'Inter',sans-serif"; const w = ctx.measureText(label).width + 40, lx = Math.max(w / 2 + 30, Math.min(W - w / 2 - 40, x));
      ctx.fillStyle = hexA(C.ink, .85); ctx.strokeStyle = C.brand; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(lx - w / 2, ly - 22, w, 44, 22); ctx.fill(); ctx.stroke();
      ctx.restore();
      text(label, lx, ly, { size: 26, weight: 700, align: 'center', base: 'middle', color: '#ffffff', alpha: a });
    });

    // cabeza brillante y año
    const hx = X(yr), hy = Y(val(yr));
    if (p < 1) { ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 36; ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.arc(hx, hy, 13, 0, TAU); ctx.fill(); ctx.restore(); }
    text(String(Math.floor(yr)), W - 120, 205, { size: 110, weight: 800, align: 'right', color: C.brand });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
