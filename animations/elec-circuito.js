/* Electricidad — Circuito simple: pila, interruptor y lámpara.
   Muestra el sentido real de los electrones (de − a +) y el sentido convencional de la corriente (de + a −).
   Esquema didáctico, sin escala. params.at fija el instante de las capturas (miniatura/PDF). */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, mix, clamp } = api;
  // api.text ignora ctx.globalAlpha: este envoltorio lo respeta (desvanecidos y paneles atenuados)
  const text = (s, x, y, o = {}) => api.text(s, x, y, { ...o, alpha: (o.alpha ?? 1) * ctx.globalAlpha });
  const BLUE = '#4aa3ff', RED = '#ff6b6b', AMB = '#ffd54a';
  const X0 = 900, X1 = 1780, Y0 = 420, Y1 = 870, YM = 645;       // lazo del circuito
  const SW0 = 1260, SW1 = 1400;                                  // contactos del interruptor
  const CYC = 16, SPEED = 130;
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const LW = X1 - X0, LH = Y1 - Y0, L = 2 * (LW + LH);

  // electrones: abajo (→), derecha (↑), arriba (←), izquierda (↓)
  const pos = s => {
    s = ((s % L) + L) % L;
    if (s < LW) return [X0 + s, Y1]; s -= LW;
    if (s < LH) return [X1, Y1 - s]; s -= LH;
    if (s < LW) return [X1 - s, Y0]; s -= LW;
    return [X0, Y0 + s];
  };
  // sentido convencional (horario) por fuera del lazo: devuelve punto y dirección
  const posOut = (s, d) => {
    s = ((s % L) + L) % L;
    if (s < LW) return [X0 + s, Y0 - d, 1, 0]; s -= LW;
    if (s < LH) return [X1 + d, Y0 + s, 0, 1]; s -= LH;
    if (s < LW) return [X1 - s, Y1 + d, -1, 0]; s -= LW;
    return [X0 - d, Y1 - s, 0, -1];
  };
  const inGap = (x, y) => (x === X0 && Math.abs(y - YM) < 54) || (x === X1 && Math.abs(y - YM) < 76) || (y === Y0 && x > SW0 - 6 && x < SW1 + 6);

  function wire(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (params.at ?? 9) : t % CYC;
    const fade = c > CYC - .8 ? clamp(1 - (c - (CYC - .8)) / .8) : 1;
    const sw = ph(c, 1.4, 2.2) * (1 - ph(c, 12.4, 13.2));                 // 0 abierto … 1 cerrado
    const lit = c < 12.4 ? ph(c, 2, 2.6) : 1 - ph(c, 12.4, 12.9);
    const flow = clamp(c - 2.2, 0, 12.4 - 2.2);                            // segundos con corriente
    const conv = ph(c, 7, 7.8) * (1 - ph(c, 12, 12.4));
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // ---- cables ----
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = hexA(C.fg, .55);
    wire([[X0, Y1], [X1, Y1], [X1, YM + 76]]);
    wire([[X1, YM - 76], [X1, Y0], [SW1, Y0]]);
    wire([[SW0, Y0], [X0, Y0], [X0, YM - 54]]);
    wire([[X0, YM + 54], [X0, Y1]]);

    // ---- pila ----
    ctx.lineWidth = 8; wire([[X0, YM - 54], [X0, YM - 30]]); wire([[X0, YM + 30], [X0, YM + 54]]);
    ctx.lineWidth = 10; ctx.strokeStyle = C.fg; wire([[X0 - 44, YM - 30], [X0 + 44, YM - 30]]);
    ctx.lineWidth = 14; wire([[X0 - 24, YM + 30], [X0 + 24, YM + 30]]);
    text('+', X0 + 64, YM - 18, { size: 40, weight: 800, color: RED });
    text('−', X0 + 52, YM + 44, { size: 44, weight: 800, color: BLUE });
    text('Pila', X0 - 64, YM + 8, { size: 26, weight: 700, align: 'right', alpha: .85 });

    // ---- interruptor ----
    const a = -.66 * (1 - sw), bx = SW0 + 140 * Math.cos(a), by = Y0 + 140 * Math.sin(a);
    ctx.strokeStyle = C.fg; ctx.lineWidth = 9; wire([[SW0, Y0], [bx, by]]);
    ctx.fillStyle = C.brand; [[SW0, Y0], [SW1, Y0]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 12, 0, 6.2832); ctx.fill(); });
    text('Interruptor', (SW0 + SW1) / 2, Y0 + 62, { size: 26, weight: 700, align: 'center', alpha: .85 });

    // ---- lámpara ----
    if (lit > 0) {
      const g = ctx.createRadialGradient(X1, YM, 0, X1, YM, 210); g.addColorStop(0, hexA(AMB, .55 * lit)); g.addColorStop(1, hexA(AMB, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X1, YM, 210, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = hexA(C.fg, .55); ctx.lineWidth = 8; wire([[X1, YM + 76], [X1, YM + 62]]); wire([[X1, YM - 76], [X1, YM - 62]]);
    ctx.fillStyle = hexA(AMB, .12 + .7 * lit); ctx.beginPath(); ctx.arc(X1, YM, 62, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = C.fg; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(X1, YM, 62, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = lit > .3 ? mix('#ffffff', AMB, .3) : hexA(C.fg, .6); ctx.lineWidth = 6;
    wire([[X1 - 34, YM - 34], [X1 - 12, YM + 8], [X1 + 12, YM - 8], [X1 + 34, YM + 34]]);
    text('Lámpara', X1 - 88, YM + 10, { size: 26, weight: 700, align: 'right', alpha: .85 });

    // ---- electrones ----
    const N = Math.round(L / 50), sp = L / N, off = flow * SPEED;
    for (let i = 0; i < N; i++) {
      const [x, y] = pos(i * sp + off); if (inGap(Math.round(x), Math.round(y))) continue;
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 4.5, y); ctx.lineTo(x + 4.5, y); ctx.stroke();
    }

    // ---- sentido convencional ----
    if (conv > 0) {
      ctx.globalAlpha = fade * conv; ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const M = 14, sm = L / M;
      for (let i = 0; i < M; i++) {
        const [x, y, dx, dy] = posOut(i * sm + flow * SPEED, 40); if (dx === 0 && Math.abs(y - YM) < 110) continue;
        ctx.beginPath(); ctx.moveTo(x - dx * 14 - dy * 11, y - dy * 14 + dx * 11); ctx.lineTo(x + dx * 8, y + dy * 8); ctx.lineTo(x - dx * 14 + dy * 11, y - dy * 14 - dx * 11); ctx.stroke();
      }
      text('Sentido convencional: de + a −', (X0 + X1) / 2, Y0 - 84, { size: 30, weight: 800, align: 'center', color: RED });
      ctx.globalAlpha = fade;
    }
    if (c > 3.2 && c < 12.6) text('Electrones: de − a +', (X0 + X1) / 2, Y1 + 84, { size: 30, weight: 800, align: 'center', color: BLUE, alpha: clamp((c - 3.2) / .6) });

    // ---- estado ----
    const closed = c >= 2.2 && c < 12.4, moving = (c >= 1.4 && c < 2.2) || (c >= 12.4 && c < 13.2);
    text(moving ? 'Moviendo el interruptor…' : closed ? 'Circuito cerrado' : 'Interruptor abierto', 120, 900, { size: 40, weight: 800, color: closed ? C.brand : C.fg });
    text(closed ? 'Los electrones se desplazan y la lámpara se enciende.' : 'El camino está cortado: no circula corriente.', 120, 950, { size: 26, weight: 600, alpha: .85 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
