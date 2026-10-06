/* Sistema Solar — Tamaños a escala (las distancias NO están a escala).
   La cámara recorre desde el Sol hasta Neptuno. Ciclo de 20 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, ease, TAU, mix } = api;
  const CYC = 20, K = 40, CYR = 600;                     // K px = diámetro de la Tierra
  const EQ = 12756;
  // [nombre, diámetro ecuatorial (km), color]
  const PL = [['Mercurio', 4879, '#B8B8B8'], ['Venus', 12104, '#E8C27A'], ['Tierra', 12756, '#4FA3FF'], ['Marte', 6792, '#D9644A'],
    ['Júpiter', 142984, '#D9A066'], ['Saturno', 120536, '#E3CB8F'], ['Urano', 51118, '#7FDCE0'], ['Neptuno', 49528, '#4A6CF0']];
  const SUN = 1392700, SUNR = SUN / EQ * K / 2, EDGE = 250, GAP = 150;
  let x = EDGE + 170;
  const items = PL.map(([n, d, col]) => { const r = d / EQ * K / 2; const o = { n, d, col, r, x: x + r }; x += 2 * r + GAP; return o; });
  const MAXPAN = Math.max(0, x - GAP - (W - 200));
  const fmt = n => n.toLocaleString('es-ES');

  const sphere = (cx, cy, r, col) => {
    const g = ctx.createRadialGradient(cx - r * .35, cy - r * .35, r * .1, cx, cy, r);
    g.addColorStop(0, mix(col, '#ffffff', .5)); g.addColorStop(1, mix(col, '#000000', .38));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  };

  function frame(dt, t) {
    const c = api.static ? 9 : t % CYC, fade = c > 19.2 ? clamp(1 - (c - 19.2) / .8) : 1;
    const cam = ease(clamp((c - 2.2) / 12)) * MAXPAN;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // Sol (arco enorme)
    const sx = EDGE - SUNR - cam, g = ctx.createRadialGradient(sx + SUNR * .6, CYR, SUNR * .5, sx, CYR, SUNR);
    g.addColorStop(0, '#FFD27A'); g.addColorStop(1, '#FF7A12');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, CYR, SUNR, 0, TAU); ctx.fill();
    text('El Sol', 70 - cam, CYR - 40, { size: 64, weight: 800, color: '#2a1500' });
    text('1.392.700 km · 109 veces la Tierra', 70 - cam, CYR + 12, { size: 28, weight: 700, color: '#2a1500' });

    // planetas
    items.forEach(p => {
      const px = p.x - cam; if (px < -500 || px > W + 500) return;
      const vis = clamp(Math.min(px - 40, W - 40 - px) / 160);
      if (p.n === 'Saturno') {
        ctx.strokeStyle = hexA('#E3CB8F', .75); ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(px, CYR, p.r * 2.05, p.r * .55, -.28, Math.PI, TAU); ctx.stroke();
      }
      sphere(px, CYR, p.r, p.col);
      if (p.n === 'Júpiter') { ctx.save(); ctx.beginPath(); ctx.arc(px, CYR, p.r, 0, TAU); ctx.clip(); ctx.strokeStyle = hexA('#8a5a2b', .35); ctx.lineWidth = 12; [-.55, -.25, .05, .35, .62].forEach(f => { ctx.beginPath(); ctx.moveTo(px - p.r, CYR + f * p.r); ctx.lineTo(px + p.r, CYR + f * p.r); ctx.stroke(); }); ctx.restore(); }
      if (p.n === 'Saturno') { ctx.strokeStyle = hexA('#E3CB8F', .75); ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(px, CYR, p.r * 2.05, p.r * .55, -.28, 0, Math.PI); ctx.stroke(); }
      text(p.n, px, 905, { size: 32, weight: 800, align: 'center', alpha: vis });
      text(`${fmt(p.d)} km`, px, 944, { size: 24, weight: 600, align: 'center', alpha: .8 * vis });
      text(p.n === 'Tierra' ? '1 × Tierra' : `${(p.d / EQ).toFixed(2).replace('.', ',')} × Tierra`, px, 978, { size: 22, weight: 500, align: 'center', alpha: .6 * vis });
      if (p.n === 'Tierra') {
        ctx.fillStyle = C.brand; ctx.beginPath(); ctx.roundRect(px - 82, CYR - 120, 164, 44, 22); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px - 10, CYR - 76); ctx.lineTo(px + 10, CYR - 76); ctx.lineTo(px, CYR - 58); ctx.closePath(); ctx.fill();
        text('Tú estás aquí', px, CYR - 98, { size: 24, weight: 700, align: 'center', base: 'middle', color: '#ffffff', alpha: vis });
      }
    });
    text('Tamaños a escala · las distancias NO', W - 120, 205, { size: 28, weight: 700, align: 'right', color: C.brand });
    text('están a escala', W - 120, 242, { size: 28, weight: 700, align: 'right', color: C.brand });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
