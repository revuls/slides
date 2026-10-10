/* Electricidad — Ley de Ohm (V = I · R).
   Primero la resistencia es fija (6 Ω) y sube la tensión; después la tensión es fija (12 V) y baja la resistencia.
   La velocidad de los electrones es proporcional a la intensidad y el punto recorre la recta V = R · I. Esquema didáctico.
   params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, clamp, lerp, ease } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const BLUE = '#4aa3ff';
  const STEPS = [[3, 6], [6, 6], [12, 6], [12, 12], [12, 6], [12, 3]], SEG = 3, CYC = SEG * STEPS.length;   // [V, R]
  // circuito
  const X0 = 210, X1 = 800, Y0 = 590, Y1 = 850, YM = 720, LW = X1 - X0, LH = Y1 - Y0, L = 2 * (LW + LH);
  const pos = s => {
    s = ((s % L) + L) % L;
    if (s < LW) return [X0 + s, Y1]; s -= LW;
    if (s < LH) return [X1, Y1 - s]; s -= LH;
    if (s < LW) return [X1 - s, Y0]; s -= LW;
    return [X0, Y0 + s];
  };
  // gráfica V–I
  const GX0 = 1120, GY0 = 880, PXI = 165, PXV = 50;           // 4 A → 660 px · 12 V → 600 px
  const gx = i => GX0 + i * PXI, gy = v => GY0 - v * PXV;
  const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const val = c => {
    const k = Math.min(STEPS.length - 1, Math.floor(c / SEG)); if (k === 0) return STEPS[0];
    const u = ease(clamp((c - k * SEG) / .7)), a = STEPS[k - 1], b = STEPS[k];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  };
  let off = 0;

  function line(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 15) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const [V, R] = val(c), I = V / R, part2 = c >= SEG * 3 - .01, key = part2 ? 'R' : 'V';
    off += 90 * I * dt;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // ---- ecuación ----
    const toks = [[fmt(V) + ' V', 'V'], ['=', ''], [fmt(Math.round(I * 100) / 100) + ' A', 'I'], ['·', ''], [fmt(R) + ' Ω', 'R']];
    ctx.font = "800 74px 'Inter',sans-serif"; let ex = 120;
    toks.forEach(([s, k]) => {
      text(s, ex, 470, { size: 74, weight: 800, color: k === key ? C.brand : C.fg, alpha: k ? 1 : .6 });
      ex += ctx.measureText(s).width + 30;
    });
    text('V = I · R', 120, 520, { size: 28, weight: 700, alpha: .6 });

    // ---- circuito ----
    ctx.lineWidth = 8; ctx.strokeStyle = hexA(C.fg, .55);
    line([[X0, Y1], [X1, Y1], [X1, YM + 90]]); line([[X1, YM - 90], [X1, Y0], [X0, Y0], [X0, YM - 40]]); line([[X0, YM + 40], [X0, Y1]]);
    ctx.lineWidth = 8; line([[X0, YM - 40], [X0, YM - 24]]); line([[X0, YM + 24], [X0, YM + 40]]);
    ctx.strokeStyle = C.fg; ctx.lineWidth = 10; line([[X0 - 42, YM - 24], [X0 + 42, YM - 24]]); ctx.lineWidth = 14; line([[X0 - 22, YM + 24], [X0 + 22, YM + 24]]);
    text(fmt(V) + ' V', X0 - 62, YM + 14, { size: 38, weight: 800, align: 'right', color: key === 'V' ? C.brand : C.fg });
    // resistencia (zigzag); se calienta con I
    const heat = clamp(I / 4);
    ctx.strokeStyle = heat > .02 ? `rgb(${Math.round(lerp(190, 255, heat))},${Math.round(lerp(190, 120, heat))},${Math.round(lerp(190, 60, heat))})` : C.fg; ctx.lineWidth = 9;
    const zig = [[X1, YM - 90]]; for (let i = 0; i < 6; i++) zig.push([X1 + (i % 2 ? 26 : -26), YM - 90 + 15 + i * 30]); zig.push([X1, YM + 90]); line(zig);
    text(fmt(R) + ' Ω', X1 + 58, YM + 12, { size: 38, weight: 800, color: key === 'R' ? C.brand : C.fg });
    text('Pila', X0 + 62, Y0 - 22, { size: 24, weight: 700, alpha: .7 }); text('Resistencia', X1 - 4, Y0 - 22, { size: 24, weight: 700, align: 'center', alpha: .7 });
    // electrones
    const N = Math.round(L / 46), sp = L / N;
    for (let i = 0; i < N; i++) {
      const [x, y] = pos(i * sp + off); if ((x === X0 && Math.abs(y - YM) < 46) || (x === X1 && Math.abs(y - YM) < 96)) continue;
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.stroke();
    }

    // ---- gráfica V–I ----
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; line([[GX0, gy(12) - 16], [GX0, GY0], [gx(4) + 20, GY0]]);
    for (let i = 0; i <= 4; i++) { ctx.lineWidth = 3; line([[gx(i), GY0], [gx(i), GY0 + 10]]); text(String(i), gx(i), GY0 + 42, { size: 24, weight: 700, align: 'center', alpha: .75 }); }
    for (let v = 0; v <= 12; v += 4) { ctx.lineWidth = 3; line([[GX0 - 10, gy(v)], [GX0, gy(v)]]); text(String(v), GX0 - 20, gy(v) + 8, { size: 24, weight: 700, align: 'right', alpha: .75 }); }
    text('Intensidad, I (A)', gx(4) + 20, GY0 + 84, { size: 26, weight: 700, align: 'right', alpha: .8 });
    text('Tensión, V (V)', GX0 - 4, gy(12) - 58, { size: 26, weight: 700, alpha: .8 });
    [3, 6, 12].forEach(r => {   // rectas V = R·I para cada resistencia
      const ie = Math.min(4, 12 / r); ctx.strokeStyle = hexA(C.fg, .22); ctx.lineWidth = 3; ctx.setLineDash([10, 10]); line([[gx(0), gy(0)], [gx(ie), gy(ie * r)]]); ctx.setLineDash([]);
      if (r === 3) text('3 Ω', gx(3.4) + 8, gy(3.4 * 3) + 38, { size: 24, weight: 700, alpha: .55 }); else text(r + ' Ω', gx(ie) + 12, gy(ie * r) - 14, { size: 24, weight: 700, align: 'center', alpha: .55 });
    });
    const ie = Math.min(4, 12 / R); ctx.strokeStyle = C.brand; ctx.lineWidth = 8; line([[gx(0), gy(0)], [gx(ie), gy(ie * R)]]);
    ctx.setLineDash([8, 9]); ctx.strokeStyle = hexA(C.brand, .8); ctx.lineWidth = 3; line([[gx(I), GY0], [gx(I), gy(V)], [GX0, gy(V)]]); ctx.setLineDash([]);
    ctx.save(); ctx.shadowColor = C.brand; ctx.shadowBlur = 26; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gx(I), gy(V), 15, 0, 6.2832); ctx.fill(); ctx.restore();
    text(fmt(Math.round(I * 100) / 100) + ' A', gx(I), GY0 - 16, { size: 26, weight: 800, align: 'center', color: C.brand });
    text(fmt(V) + ' V', GX0 + 14, gy(V) - 12, { size: 26, weight: 800, color: C.brand });
    text('La pendiente de la recta es la resistencia', gx(4) + 20, gy(1.8), { size: 24, weight: 600, align: 'right', alpha: .6 });

    // ---- mensaje ----
    text(part2 ? 'Misma tensión: a menos resistencia, más intensidad' : 'Misma resistencia: a más tensión, más intensidad', 120, 948, { size: 32, weight: 800, color: C.brand });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
