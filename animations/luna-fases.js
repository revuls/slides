/* La Luna — Fases (ciclo de 29,5 días acelerado). Izquierda: Sol, Tierra y Luna vistos desde arriba.
   Derecha: cómo se ve la Luna desde el hemisferio norte. Ciclo de 16 s, continuo. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, TAU, mix } = api;
  const PER = 16, EX = 700, EY = 690, R = 250, IX = 1470, IY = 670, IR = 190;
  const LIT = '#EDEAE0', DARK = mix(C.bg, '#ffffff', .1);

  const name = u => {
    const e = .025;
    if (u < e || u > 1 - e) return 'Luna nueva'; if (Math.abs(u - .25) < e) return 'Cuarto creciente'; if (Math.abs(u - .5) < e) return 'Luna llena'; if (Math.abs(u - .75) < e) return 'Cuarto menguante';
    return u < .25 ? 'Creciente' : u < .5 ? 'Gibosa creciente' : u < .75 ? 'Gibosa menguante' : 'Menguante';
  };
  function disc(cx, cy, r, f, waxing) {
    ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    const lit = waxing ? false : true;                            // true = semicírculo izquierdo
    ctx.fillStyle = LIT; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, lit); ctx.closePath(); ctx.fill();
    if (f < .5) { ctx.fillStyle = DARK; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(.01, r * (1 - 2 * f)), r, 0, -Math.PI / 2, Math.PI / 2, lit); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = LIT; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(.01, r * (2 * f - 1)), r, 0, -Math.PI / 2, Math.PI / 2, !lit); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }

  function frame(dt, t) {
    const u = api.static ? .38 : (t % PER) / PER, al = TAU * u, f = (1 - Math.cos(al)) / 2;
    ctx.clearRect(0, 0, W, H);

    // Sol y rayos
    const g = ctx.createRadialGradient(90, EY, 10, 90, EY, 190); g.addColorStop(0, hexA('#FFD27A', .95)); g.addColorStop(1, hexA('#FF8A1F', 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(90, EY, 190, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.arc(90, EY, 70, 0, TAU); ctx.fill();
    ctx.strokeStyle = hexA('#FFD27A', .35); ctx.lineWidth = 3; ctx.setLineDash([16, 14]);
    [-190, -110, 110, 190].forEach(dy => { ctx.beginPath(); ctx.moveTo(230, EY + dy); ctx.lineTo(EX + R + 100, EY + dy); ctx.stroke(); }); ctx.setLineDash([]);
    text('Luz del Sol', 330, EY - 215, { size: 24, weight: 600, alpha: .7 });

    // órbita, Tierra y Luna
    ctx.strokeStyle = hexA(C.fg, .3); ctx.lineWidth = 2; ctx.setLineDash([6, 12]); ctx.beginPath(); ctx.arc(EX, EY, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#4FA3FF'; ctx.beginPath(); ctx.arc(EX, EY, 62, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(EX, EY, 62, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
    text('Tierra', EX, EY + 100, { size: 24, weight: 600, align: 'center', alpha: .8 });
    const mx = EX - R * Math.cos(al), my = EY + R * Math.sin(al);
    ctx.strokeStyle = hexA(C.brand, .5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(EX, EY); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(mx, my, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = LIT; ctx.beginPath(); ctx.arc(mx, my, 30, Math.PI / 2, -Math.PI / 2); ctx.closePath(); ctx.fill();   // mitad iluminada, hacia el Sol
    ctx.strokeStyle = C.brand; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, my, 30, 0, TAU); ctx.stroke();
    text('Nueva', EX - R - 34, EY + 8, { size: 22, weight: 600, align: 'right', alpha: .6 });
    text('Cuarto creciente', EX, EY + R + 58, { size: 22, weight: 600, align: 'center', alpha: .6 });
    text('Llena', EX + R + 34, EY + 8, { size: 22, weight: 600, alpha: .6 });
    text('Cuarto menguante', EX, EY - R - 36, { size: 22, weight: 600, align: 'center', alpha: .6 });

    // vista desde la Tierra
    text('Vista desde la Tierra (hemisferio norte)', IX, IY - IR - 48, { size: 26, weight: 600, align: 'center', alpha: .75 });
    ctx.save(); ctx.shadowColor = hexA(LIT, .4); ctx.shadowBlur = 40 * f; disc(IX, IY, IR, f, u < .5); ctx.restore();
    text(name(u), IX, IY + IR + 82, { size: 56, weight: 800, align: 'center', color: C.brand });
    text(`Día ${Math.max(1, Math.round(u * 29.53))} de 29,5 · iluminada ${Math.round(f * 100)} %`, IX, IY + IR + 128, { size: 26, weight: 600, align: 'center', alpha: .8 });
  }
  return { frame };
});
