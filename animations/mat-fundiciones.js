/* Materiales — Microestructura de las fundiciones: blanca, gris y nodular (dibujos ilustrativos, no micrografías).
   Pasa el ratón por una de las tres vistas para destacarla; si no, se destacan por turnos (6 s cada una). Ciclo 18 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp } = api;
  const R = 150, Y = 600, XS = [1070, 1400, 1710];
  const INFO = [
    { n: 'Fundición blanca', a: 'Carbono combinado como cementita', b: 'Muy dura y frágil, difícil de mecanizar', c: 'Rodillos, zapatas de freno, martillos' },
    { n: 'Fundición gris', a: 'Carbono en láminas de grafito', b: 'Blanda, amortigua vibraciones, frágil al impacto', c: 'Bloques de motor, bancadas, carcasas' },
    { n: 'Fundición nodular', a: 'Grafito en esferas (con Mg o Ce)', b: 'Dúctil y tenaz, resistencia similar al acero', c: 'Cigüeñales, tuberías a presión, eólica' }
  ];
  let sd = 17; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  // elementos precalculados (en coordenadas normalizadas −1..1)
  const WHITE = Array.from({ length: 16 }, () => ({ x: rnd() * 1.6 - .8, y: rnd() * 1.6 - .8, rx: .16 + rnd() * .14, ry: .08 + rnd() * .07, a: rnd() * Math.PI }));
  const FLAKES = Array.from({ length: 14 }, () => ({ x: rnd() * 1.8 - .9, y: rnd() * 1.8 - .9, l: .35 + rnd() * .5, a: rnd() * Math.PI, w: 3 + rnd() * 3, k: rnd() * 2 - 1 }));
  const NOD = Array.from({ length: 11 }, () => ({ x: rnd() * 1.5 - .75, y: rnd() * 1.5 - .75, r: .1 + rnd() * .07 }));

  function view(k, cx, cy, r, hl) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
    if (k === 0) {                                   // cementita (clara) con islas de perlita (oscuras, laminadas)
      ctx.fillStyle = '#eef1f6'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      WHITE.forEach(e => { ctx.save(); ctx.translate(cx + e.x * r, cy + e.y * r); ctx.rotate(e.a); ctx.fillStyle = '#4b5563'; ctx.beginPath(); ctx.ellipse(0, 0, e.rx * r, e.ry * r, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2; for (let i = -e.rx * r; i < e.rx * r; i += 9) { ctx.beginPath(); ctx.moveTo(i, -e.ry * r); ctx.lineTo(i, e.ry * r); ctx.stroke(); } ctx.restore(); });
    } else if (k === 1) {                            // matriz clara con láminas de grafito
      ctx.fillStyle = '#d7dde8'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      FLAKES.forEach(f => { ctx.strokeStyle = '#1f2430'; ctx.lineWidth = f.w; ctx.lineCap = 'round'; ctx.beginPath(); const x0 = cx + f.x * r, y0 = cy + f.y * r, dx = Math.cos(f.a) * f.l * r, dy = Math.sin(f.a) * f.l * r; ctx.moveTo(x0 - dx / 2, y0 - dy / 2); ctx.quadraticCurveTo(x0 + f.k * 30, y0 - f.k * 30, x0 + dx / 2, y0 + dy / 2); ctx.stroke(); });
    } else {                                         // nódulos de grafito rodeados de ferrita
      ctx.fillStyle = '#b9c2d3'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      NOD.forEach(n => { ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(cx + n.x * r, cy + n.y * r, n.r * r * 1.7, 0, TAU); ctx.fill(); ctx.fillStyle = '#1f2430'; ctx.beginPath(); ctx.arc(cx + n.x * r, cy + n.y * r, n.r * r, 0, TAU); ctx.fill(); });
    }
    ctx.restore();
    ctx.strokeStyle = hl ? C.brand : hexA(C.fg, .5); ctx.lineWidth = hl ? 10 : 5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    ctx.clearRect(0, 0, W, H);
    let hov = -1; XS.forEach((x, i) => { if (Math.hypot(pointer.x - x, pointer.y - Y) < R + 30) hov = i; });
    const cur = hov >= 0 ? hov : api.static ? 1 : Math.floor((t % 18) / 6);
    XS.forEach((x, i) => {
      const on = i === cur, r = R * (on ? 1.14 : .94);
      ctx.globalAlpha = on ? 1 : .55; view(i, x, Y, r, on); ctx.globalAlpha = 1;
      text(INFO[i].n, x, Y + R + 70, { size: on ? 32 : 26, weight: 800, align: 'center', color: on ? C.brand : C.fg, alpha: on ? 1 : .7 });
    });
    const I = INFO[cur];
    text(I.n, 120, 600, { size: 44, weight: 800, color: C.brand });
    [['Estructura', I.a], ['Propiedades', I.b], ['Usos', I.c]].forEach(([h, v], k) => { text(h, 120, 664 + k * 96, { size: 22, weight: 800, color: C.brandXl, alpha: .95 }); text(v, 120, 698 + k * 96, { size: 26, weight: 600, alpha: .92 }); });
    text('Dibujos ilustrativos · pasa el ratón por una vista', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
