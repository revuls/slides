/* Segunda Guerra Mundial — Día D, 6 de junio de 1944 (esquema).
   Primero los paracaidistas (noche) y después las oleadas de lanchas hacia las cinco playas.
   El Canal queda arriba y Normandía abajo. Ciclo de 16 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, ease, TAU } = api;
  const CYC = 16, COAST = 720;
  const BEACH = [['Utah', 'EE. UU.', 560, 'A'], ['Omaha', 'EE. UU.', 790, 'A'], ['Gold', 'R. Unido', 1050, 'B'], ['Juno', 'Canadá', 1270, 'B'], ['Sword', 'R. Unido', 1490, 'B']];
  const col = s => s === 'A' ? C.brand : C.sec;
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // paracaidistas: oeste (EE. UU.) y este (R. Unido)
  const para = Array.from({ length: 30 }, (_, i) => { const w = i < 15; return { x: w ? 360 + rnd() * 300 : 1560 + rnd() * 150, y1: 790 + rnd() * 120, t0: .2 + rnd() * 2.6, side: w ? 'A' : 'B', ph: rnd() * TAU }; });
  const ships = []; BEACH.forEach((b, k) => { for (let w = 0; w < 7; w++) ships.push({ k, w, t0: 3.6 + k * .22 + w * .85, dx: (w % 3 - 1) * 26 }); });
  const coastY = x => COAST + Math.sin(x / 190) * 14;

  function frame(dt, t) {
    const c = api.static ? 10.5 : t % CYC, fade = c > 15.2 ? clamp(1 - (c - 15.2) / .8) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // mar (olas) y tierra
    ctx.strokeStyle = hexA(C.fg, .07); ctx.lineWidth = 3;
    for (let r = 0; r < 9; r++) { ctx.beginPath(); for (let x = 0; x <= W; x += 20) { const y = 390 + r * 34 + Math.sin(x / 120 + c * 1.4 + r) * 7; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, coastY(x)); ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = hexA(C.fg, .07); ctx.fill();
    ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 5; ctx.beginPath(); for (let x = 0; x <= W; x += 20) x ? ctx.lineTo(x, coastY(x)) : ctx.moveTo(x, coastY(x)); ctx.stroke();
    ctx.setLineDash([4, 14]); ctx.strokeStyle = hexA('#E5384A', .7); ctx.lineWidth = 4; ctx.beginPath(); for (let x = 0; x <= W; x += 20) x ? ctx.lineTo(x, coastY(x) + 34) : ctx.moveTo(x, coastY(x) + 34); ctx.stroke(); ctx.setLineDash([]);
    text('Muro Atlántico', 90, COAST + 100, { size: 26, weight: 600, color: '#E5384A', alpha: .9 });
    text('FRANCIA', 90, 960, { size: 28, weight: 700, alpha: .35 }); text('CANAL DE LA MANCHA', 90, 660, { size: 28, weight: 700, alpha: .35 });

    // playas
    BEACH.forEach(([n, p, x, s]) => {
      const y = coastY(x);
      ctx.fillStyle = col(s); ctx.beginPath(); ctx.roundRect(x - 62, y + 56 - 4, 124, 8, 4); ctx.fill();
      text(n, x, y + 92, { size: 32, weight: 800, align: 'center', color: col(s) }); text(p, x, y + 126, { size: 22, weight: 600, align: 'center', alpha: .75 });
    });

    // paracaidistas
    para.forEach(q => {
      const u = clamp((c - q.t0) / 3.6); if (u <= 0) return;
      const y = 470 + (q.y1 - 470) * ease(u), x = q.x + Math.sin(c * 2 + q.ph) * 12 * (1 - u);
      if (u < 1) {
        ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x, y + 26); ctx.lineTo(x + 16, y); ctx.stroke();
        ctx.fillStyle = col(q.side); ctx.beginPath(); ctx.arc(x, y, 17, Math.PI, 0); ctx.fill();
        ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(x, y + 28, 4, 0, TAU); ctx.fill();
      } else { ctx.fillStyle = hexA(col(q.side), .8); ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
    });

    // oleadas
    ships.forEach(s => {
      const u = clamp((c - s.t0) / 3.2); if (u <= 0) return;
      const [, , bx, side] = BEACH[s.k], x = bx + s.dx + Math.sin(c * 3 + s.k + s.w) * 8, y0 = 400, yc = coastY(bx) - 8, y = y0 + (yc - y0) * ease(u);
      if (u < 1) {
        ctx.strokeStyle = hexA(C.fg, .25); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 60 * u); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = col(side); ctx.beginPath(); ctx.roundRect(x - 15, y - 9, 30, 18, 6); ctx.fill();
      } else {
        const a = c - s.t0 - 3.2;
        for (let d = 0; d < 3; d++) { const k = clamp(a / 2.2); ctx.fillStyle = hexA(col(side), (1 - k) * .9); ctx.beginPath(); ctx.arc(x + (d - 1) * 22 * (1 + k), yc + 24 + k * (60 + d * 14), 6, 0, TAU); ctx.fill(); }
      }
    });

    // rótulos de fase y contador
    const night = c < 3.6;
    text(night ? 'Madrugada · paracaidistas tras las líneas enemigas' : '06:30 · desembarco en cinco playas', W - 120, 285, { size: 28, weight: 700, align: 'right', color: C.brand });
    const n = Math.round(156000 * ease(clamp((c - 3.6) / 7))); const s = n.toLocaleString('es-ES');
    text(s, W - 120, 205, { size: 96, weight: 800, align: 'right', color: C.brand });
    text('soldados aliados en tierra (≈156.000 el día D)', W - 120, 325, { size: 24, weight: 600, align: 'right', alpha: .75 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
