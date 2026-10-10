/* Materiales — Péndulo de Charpy: ensayo de resiliencia.
   Dos ensayos seguidos con el mismo péndulo: un material frágil (absorbe poca energía, el péndulo sube mucho)
   y otro tenaz (absorbe mucha energía, el péndulo apenas sube). Física de péndulo real; los porcentajes de
   energía absorbida son ilustrativos. Ciclo 26 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, TAU, hexA, mix, text, clamp, lerp } = api;
  const BLUE = '#4aa3ff', GRN = '#5fd08a';
  const PX = 1330, PY = 250, L = 420, TH0 = 95 * Math.PI / 180, GL = 1.5, RUN = 13, REL = 1.2;
  const BOT = PY + L, SPEC_Y = BOT + 6;
  const RUNS = [{ loss: .16, name: 'Material frágil', msg: 'Absorbe poca energía: el péndulo sube casi hasta donde partió', col: BLUE }, { loss: .62, name: 'Material tenaz', msg: 'Absorbe mucha energía: el péndulo apenas sube', col: GRN }];
  // trayectoria precalculada (idéntica en cada bucle)
  const traj = RUNS.map(r => {
    const out = [], dt = 1 / 240; let th = TH0, w = 0, t = 0, hit = -1, thMax = 0, passed = false, after = false;
    for (let i = 0; i < RUN * 60; i++) {
      for (let k = 0; k < 4; k++) {
        if (t >= REL) { w -= GL * Math.sin(th) * dt; const th2 = th + w * dt; if (!passed && th > 0 && th2 <= 0) { w *= Math.sqrt(1 - r.loss); hit = t; passed = true; } th = th2; if (passed && th < thMax) thMax = th; }
        t += dt;
      }
      out.push(th);
    }
    return { th: out, hit, thMax };
  });
  const hOf = th => L * (1 - Math.cos(th));

  function frame(dt, t) {
    t = Math.max(0, t);
    const run = api.static ? 1 : Math.floor((t % (RUN * 2)) / RUN), tt = api.static ? 7 : t % RUN;
    const R = RUNS[run], tr = traj[run], th = tr.th[Math.min(tr.th.length - 1, Math.floor(tt * 60))];
    const fade = tt > RUN - .7 ? clamp(1 - (tt - (RUN - .7)) / .7) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
    // base y apoyos
    ctx.fillStyle = '#6b7280'; ctx.fillRect(PX - 170, SPEC_Y + 36, 340, 30);
    ctx.fillRect(PX - 90, SPEC_Y, 40, 38); ctx.fillRect(PX + 50, SPEC_Y, 40, 38);
    // probeta (con entalla); se rompe cuando el martillo pasa
    const broken = tr.hit >= 0 && tt >= tr.hit, fl = broken ? tt - tr.hit : 0;
    if (!broken) { ctx.fillStyle = '#d6dbe3'; ctx.fillRect(PX - 50, SPEC_Y - 34, 100, 36); ctx.fillStyle = C.bg; ctx.beginPath(); ctx.moveTo(PX - 8, SPEC_Y + 2); ctx.lineTo(PX, SPEC_Y - 16); ctx.lineTo(PX + 8, SPEC_Y + 2); ctx.fill(); }
    else {
      [[-1, -1], [1, 1]].forEach(([sd]) => { const v = 160 * (1 - R.loss) + 60, x = PX + sd * (24 + v * fl * .9), y = SPEC_Y - 16 + (-220 * fl + 520 * fl * fl) * .5; ctx.save(); ctx.translate(x, y); ctx.rotate(sd * fl * 3); ctx.fillStyle = '#d6dbe3'; ctx.globalAlpha = fade * clamp(1 - fl * .5); ctx.fillRect(-26, -17, 52, 34); ctx.restore(); });
    }
    // alturas H y h
    const yH = BOT - hOf(TH0);
    ctx.setLineDash([10, 10]); ctx.lineWidth = 3; ctx.strokeStyle = hexA(C.fg, .55); ctx.beginPath(); ctx.moveTo(PX - 450, yH); ctx.lineTo(PX + 450, yH); ctx.stroke(); ctx.setLineDash([]);
    text('H', PX - 470, yH + 10, { size: 30, weight: 800, align: 'right' });
    ctx.strokeStyle = hexA(C.fg, .25); ctx.beginPath(); ctx.moveTo(PX - 450, BOT); ctx.lineTo(PX + 450, BOT); ctx.stroke();
    if (broken && tt > tr.hit + .4) {
      const hm = hOf(tr.thMax), yh = BOT - hm, a = clamp((tt - tr.hit - .4) / .6);
      ctx.globalAlpha = fade * a; ctx.setLineDash([10, 10]); ctx.strokeStyle = R.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PX - 450, yh); ctx.lineTo(PX + 450, yh); ctx.stroke(); ctx.setLineDash([]);
      text('h', PX + 470, yh + 10, { size: 30, weight: 800, color: R.col });
      ctx.strokeStyle = C.brandXl; ctx.fillStyle = C.brandXl; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(PX + 410, yH + 6); ctx.lineTo(PX + 410, yh - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PX + 410, yH); ctx.lineTo(PX + 396, yH + 22); ctx.lineTo(PX + 424, yH + 22); ctx.fill(); ctx.beginPath(); ctx.moveTo(PX + 410, yh); ctx.lineTo(PX + 396, yh - 22); ctx.lineTo(PX + 424, yh - 22); ctx.fill();
      text('H − h', PX + 430, (yH + yh) / 2 + 10, { size: 26, weight: 800, color: C.brandXl });
      ctx.globalAlpha = fade;
    }
    // péndulo
    const bx = PX - L * Math.sin(th), by = PY + L * Math.cos(th), ang = Math.atan2(by - PY, bx - PX);
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(PX, PY); ctx.lineTo(bx, by); ctx.stroke();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ang - Math.PI / 2);
    const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#6b7280'); g.addColorStop(.5, '#e6eaf0'); g.addColorStop(1, '#5a6270'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-58, -34, 116, 78, 12); ctx.fill();
    ctx.fillStyle = C.brand; ctx.beginPath(); ctx.moveTo(-14, 44); ctx.lineTo(0, 62); ctx.lineTo(14, 44); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#f1f3f6'; ctx.beginPath(); ctx.arc(PX, PY, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b7280'; ctx.fillRect(PX - 14, PY - 120, 28, 100);
    text('Ep₁', bx > PX ? bx + 40 : bx - 90, by - 30, { size: 24, weight: 800, alpha: tt < REL + .5 ? .9 : 0 });
    // lectura
    text(R.name, 120, 590, { size: 40, weight: 800, color: R.col });
    text(tt < REL ? 'El péndulo parte de una altura H' : tt < (tr.hit >= 0 ? tr.hit + .4 : 2) ? 'Cae, golpea y rompe la probeta' : R.msg, 120, 640, { size: 26, weight: 700, alpha: .9 });
    text('Ep₁ = m·g·H     Ep₂ = m·g·h', 120, 740, { size: 32, weight: 800, color: C.brand });
    text('Energía absorbida = m·g·(H − h)', 120, 792, { size: 28, weight: 700 });
    text('Resiliencia ρ = (Ep₁ − Ep₂) / S₀', 120, 840, { size: 28, weight: 700, alpha: .9 });
    // barra de energía absorbida
    if (broken && tt > tr.hit + .6) { const a = clamp((tt - tr.hit - .6) / .8) * R.loss; ctx.fillStyle = hexA(C.fg, .15); ctx.beginPath(); ctx.roundRect(120, 890, 560, 34, 17); ctx.fill(); ctx.fillStyle = R.col; ctx.beginPath(); ctx.roundRect(120, 890, 560 * a, 34, 17); ctx.fill(); text('Energía absorbida por la probeta (ilustrativa)', 120, 960, { size: 22, weight: 600, alpha: .7 }); }
    ctx.globalAlpha = 1;
  }
  return { frame };
});
