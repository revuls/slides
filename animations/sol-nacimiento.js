/* Sistema Solar — Nacimiento: una nube gira, colapsa en un disco, se enciende el Sol y se forman los planetas.
   Ciclo de 21 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, hexA, text, clamp, ease, TAU, mix } = api;
  const CYC = 21, CX = 1130, CY = 650, TILT = .5, R0 = 400, DISK = 620, N = 460, DT = .05;
  let sd = 3; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const P = Array.from({ length: N }, () => {
    let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
    const th0 = Math.atan2(y, x);
    return { r0: Math.hypot(x, y) * R0, z0: z * R0 * .7, th0, th: th0, rt: 60 + Math.pow(rnd(), .85) * (DISK - 60), big: rnd() < .1, a: .35 + rnd() * .6 };
  });
  const kk = c => ease(clamp((c - 3) / 8));                  // 0 = nube · 1 = disco
  const SP = [0]; for (let i = 1; i <= CYC / DT + 2; i++) SP.push(SP[i - 1] + DT * (.1 + 1.6 * kk(i * DT)));
  const spin = c => { const f = c / DT, i = Math.floor(f); return SP[i] + (SP[Math.min(i + 1, SP.length - 1)] - SP[i]) * (f - i); };
  const ORB = [95, 140, 190, 255, 350, 440, 520, 590], SZ = [5, 8, 9, 7, 20, 17, 12, 12];
  const COL = ['#B8B8B8', '#E8C27A', '#4FA3FF', '#D9644A', '#D9A066', '#E3CB8F', '#7FDCE0', '#4A6CF0'];
  const pr = (x, y, z) => [CX + x, CY + y * Math.sin(TILT) - z * Math.cos(TILT)];
  let prev = 0;

  const sphere = (x, y, r, col) => {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    g.addColorStop(0, mix(col, '#ffffff', .55)); g.addColorStop(1, mix(col, '#000000', .35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };

  function frame(dt, t) {
    const c = api.static ? 17 : t % CYC;
    if (c < prev - 1) P.forEach(p => { p.th = p.th0; });
    prev = c;
    const k = kk(c), fade = c > 20.3 ? clamp(1 - (c - 20.3) / .7) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    // órbitas de los planetas
    if (c > 13) ORB.forEach((r, i) => { const ap = ease(clamp((c - (13 + i * .4)) / 1)); ctx.strokeStyle = hexA(C.fg, .14 * ap); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(CX, CY, r, r * Math.sin(TILT), 0, 0, TAU); ctx.stroke(); });

    // brillo de la protoestrella
    const prot = ease(clamp((c - 5) / 6)) * .5;
    if (prot > 0) { const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 170); g.addColorStop(0, hexA(C.brand, prot)); g.addColorStop(1, hexA(C.brand, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, 170, 0, TAU); ctx.fill(); }

    // partículas de gas y polvo
    const clear = c > 13 ? 1 - .75 * ease(clamp((c - 13) / 3)) : 1;
    P.forEach(p => {
      const r = p.r0 + (p.rt - p.r0) * k, z = p.z0 * (1 - k);
      if (api.static) p.th = p.th0 + spin(c) * .6;
      else p.th += dt * (.1 + 1.6 * k) * clamp(Math.pow(250 / Math.max(r, 30), 1.5), .4, 3.2);
      const [x, y] = pr(r * Math.cos(p.th), r * Math.sin(p.th), z);
      ctx.fillStyle = r < 160 ? hexA(C.brandXl, p.a * clear) : hexA(C.fg, p.a * (.5 + .5 * k) * clear);
      ctx.beginPath(); ctx.arc(x, y, p.big ? 3.4 : 2, 0, TAU); ctx.fill();
    });

    // ignición del Sol
    if (c >= 11) {
      const u = c - 11, fl = clamp(1 - u / 1.3), sr = 8 + 40 * ease(clamp(u / 1.6));
      if (fl > 0) { const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 520); g.addColorStop(0, hexA('#ffffff', fl * .85)); g.addColorStop(1, hexA(C.brandXl, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, 520, 0, TAU); ctx.fill(); }
      const g2 = ctx.createRadialGradient(CX, CY, sr * .4, CX, CY, sr * 3.6); g2.addColorStop(0, hexA(C.brandXl, .55)); g2.addColorStop(1, hexA(C.brandXl, 0));
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(CX, CY, sr * 3.6, 0, TAU); ctx.fill();
      sphere(CX, CY, sr, '#FFD27A');
    }

    // planetas
    ORB.forEach((r, i) => {
      const ap = ease(clamp((c - (13 + i * .4)) / 1)); if (ap <= 0) return;
      const a = i * .85 + (c - 13) * .9 * Math.pow(200 / r, 1.5), [x, y] = pr(r * Math.cos(a), r * Math.sin(a), 0);
      if (i === 5) { ctx.strokeStyle = hexA('#E3CB8F', .7 * ap); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, SZ[i] * 2 * ap, SZ[i] * .8 * ap, -.2, 0, TAU); ctx.stroke(); }
      sphere(x, y, SZ[i] * ap, COL[i]);
    });

    // fases
    const ph = c < 3 ? '1 · Nube de gas y polvo' : c < 9 ? '2 · Colapso y rotación: se forma un disco' : c < 13 ? '3 · Nace el Sol' : '4 · Se forman los planetas';
    text(ph, W - 120, 205, { size: 36, weight: 800, align: 'right', color: C.brand });
    text('Hace unos 4.600 millones de años', W - 120, 252, { size: 26, weight: 600, align: 'right', alpha: .75 });
    ctx.globalAlpha = 1;
  }
  return { frame };
});
