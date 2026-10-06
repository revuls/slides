/* Sistema Solar — Los planetas orbitan a distinto ritmo (periodos reales).
   Distancias con escala comprimida (raíz cuadrada). Primero a ritmo lento y luego en avance rápido. Ciclo de 27 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, TAU, mix } = api;
  const CYC = 27, CX = 960, CY = 650, TILT = .38;
  // [nombre, UA, periodo (años terrestres), tamaño px, color]
  const PL = [['Mercurio', .39, .241, 5, '#B8B8B8'], ['Venus', .72, .615, 8, '#E8C27A'], ['Tierra', 1, 1, 8.5, '#4FA3FF'], ['Marte', 1.52, 1.881, 6.5, '#D9644A'],
    ['Júpiter', 5.2, 11.86, 17, '#D9A066'], ['Saturno', 9.58, 29.46, 13, '#E3CB8F'], ['Urano', 19.2, 84, 11, '#7FDCE0'], ['Neptuno', 30.1, 164.8, 11, '#4A6CF0']];
  const R = au => 55 + 140 * Math.sqrt(au);
  const rate = c => c < 8 ? .125 : c < 11 ? .125 + 1.475 * (c - 8) / 3 : 1.6;               // años por segundo
  const years = c => c <= 8 ? .125 * c : c <= 11 ? 1 + .125 * (c - 8) + 1.475 * (c - 8) ** 2 / 6 : 3.5875 + 1.6 * (c - 11);
  let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const AST = Array.from({ length: 170 }, () => ({ a: rnd() * TAU, au: 2.1 + rnd() * 1.1, s: 1 + rnd() * 1.4 }));

  const sphere = (x, y, r, col) => {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    g.addColorStop(0, mix(col, '#ffffff', .55)); g.addColorStop(1, mix(col, '#000000', .35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  function frame(dt, t) {
    const c = api.static ? 20 : t % CYC, T = years(c), fade = c > 26.2 ? clamp(1 - (c - 26.2) / .8) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // órbitas
    PL.forEach(([, au]) => { ctx.strokeStyle = hexA(C.fg, .16); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY, R(au), R(au) * TILT, 0, 0, TAU); ctx.stroke(); });
    // cinturón de asteroides
    AST.forEach(o => { const a = o.a + TAU * T / (Math.pow(o.au, 1.5)), r = R(o.au); ctx.fillStyle = hexA(C.fg, .45); ctx.fillRect(CX + r * Math.cos(a), CY + r * Math.sin(a) * TILT, o.s, o.s); });
    text('Cinturón de asteroides', CX + R(2.7) * .72, CY + R(2.7) * .72 * TILT + 56, { size: 20, weight: 600, alpha: .45, align: 'center' });

    // Sol
    const g = ctx.createRadialGradient(CX, CY, 4, CX, CY, 90); g.addColorStop(0, hexA('#FFD27A', .9)); g.addColorStop(1, hexA('#FF8A1F', 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, 90, 0, TAU); ctx.fill(); sphere(CX, CY, 26, '#FFD27A');

    // planetas con estela
    PL.forEach(([name, au, per, sz, col], i) => {
      const r = R(au), a = i * .9 + TAU * T / per;
      const lag = clamp(TAU * rate(c) * .5 / per, .03, 1.1);
      for (let s = 0; s < 18; s++) {
        const a0 = a - lag * (s + 1) / 18, a1 = a - lag * s / 18;
        ctx.strokeStyle = hexA(col, .55 * (1 - s / 18)); ctx.lineWidth = sz * .45;
        ctx.beginPath(); ctx.ellipse(CX, CY, r, r * TILT, 0, a0, a1); ctx.stroke();
      }
      const x = CX + r * Math.cos(a), y = CY + r * Math.sin(a) * TILT;
      if (name === 'Saturno') { ctx.strokeStyle = hexA('#E3CB8F', .8); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, sz * 2, sz * .75, -.25, 0, TAU); ctx.stroke(); }
      sphere(x, y, sz, col);
      text(name, x + sz + 10, y - sz - 6, { size: 22, weight: 600, alpha: .9 });
    });

    // tiempo y velocidad
    text(`${T.toFixed(1).replace('.', ',')} años`, W - 120, 205, { size: 64, weight: 800, align: 'right', color: C.brand });
    const rt = rate(c);
    text(rt < .5 ? `Velocidad: ${(rt * 12).toFixed(1).replace('.', ',')} meses por segundo` : `Avance rápido: ${rt.toFixed(1).replace('.', ',')} años por segundo`, W - 120, 255, { size: 26, weight: 600, align: 'right', alpha: .85 });
    text('Distancias con escala comprimida', W - 120, 990, { size: 22, weight: 500, align: 'right', alpha: .55 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
