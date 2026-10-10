/* Materiales — Tipos de esfuerzos: tracción, compresión, flexión, torsión y cortante.
   Cada esfuerzo dura 4,5 s; haz clic en una pestaña para fijarlo. Deformaciones exageradas. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp } = api;
  const NAMES = ['Tracción', 'Compresión', 'Flexión', 'Torsión', 'Cortante'];
  const EJ = ['Cables de un puente tensado', 'Patas de una silla, pilares', 'Viga de un puente', 'Eje de transmisión, llave', 'Tijeras, remaches'];
  const DESC = ['Dos fuerzas opuestas que tienden a estirar', 'Dos fuerzas que tienden a aplastar', 'Una carga que curva la pieza', 'Un par de giros opuestos', 'Fuerzas paralelas que deslizan una sección'];
  const SEG = 4.5, CX = 1350, CY = 590, BL = 520, BH = 90;
  const BLUE = '#4aa3ff';
  const tabs = NAMES.map((n, i) => ({ n, x: 930 + i * 176, y: 160, w: 164, h: 58 }));
  let forced = -1, forcedAt = 0, was = false;
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const arrow = (x1, y1, x2, y2, col = C.brandXl, w = 9) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * 10, y2 - Math.sin(a) * 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - .45) * 30, y2 - Math.sin(a - .45) * 30); ctx.lineTo(x2 - Math.cos(a + .45) * 30, y2 - Math.sin(a + .45) * 30); ctx.closePath(); ctx.fill();
  };
  const body = (x, y, w, h, col) => { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, mix(col, '#ffffff', .35)); g.addColorStop(1, mix(col, '#000000', .3)); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); };

  function draw(k, p) {   // p = 0..1 intensidad (con rebote)
    const x0 = CX - BL / 2;
    if (k === 0) {
      const dl = 70 * p, w = BH * (1 - .22 * p);
      body(x0 - dl / 2, CY - w / 2, BL + dl, w, C.brand);
      arrow(x0 - dl / 2 - 10, CY, x0 - dl / 2 - 120, CY); arrow(x0 + BL + dl / 2 + 10, CY, x0 + BL + dl / 2 + 120, CY);
    } else if (k === 1) {
      const dl = 70 * p, w = BH * (1 + .28 * p);
      body(x0 + dl / 2, CY - w / 2, BL - dl, w, C.brand);
      arrow(x0 + dl / 2 - 120, CY, x0 + dl / 2 - 10, CY); arrow(x0 + BL - dl / 2 + 120, CY, x0 + BL - dl / 2 + 10, CY);
    } else if (k === 2) {
      const sag = 90 * p, N = 40;
      const pts = []; for (let i = 0; i <= N; i++) { const u = i / N, yy = CY + sag * (1 - Math.pow(2 * u - 1, 2)); pts.push([x0 + u * BL, yy]); }
      ctx.lineCap = 'butt'; ctx.lineWidth = BH; ctx.strokeStyle = C.brand; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = hexA('#ffffff', .75); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1] - BH / 2 + 4) : ctx.moveTo(q[0], q[1] - BH / 2 + 4)); ctx.stroke();
      ctx.fillStyle = '#6b7280'; [x0 + 10, x0 + BL - 10].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 34, CY + BH / 2 + 62); ctx.lineTo(x + 34, CY + BH / 2 + 62); ctx.lineTo(x, CY + BH / 2 + 2); ctx.closePath(); ctx.fill(); });
      arrow(CX, CY - 200 + sag, CX, CY - BH / 2 + sag - 8);
      text('Fibras superiores: compresión · inferiores: tracción', CX, CY + 220, { size: 24, weight: 700, align: 'center', alpha: .85 });
    } else if (k === 3) {
      const tw = 2.4 * p, N = 36, rr = 60;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, a0 = tw * (u0 - .5), a1 = tw * (u1 - .5);
        const xa = x0 + u0 * BL, xb = x0 + u1 * BL + 1;
        const g = ctx.createLinearGradient(0, CY - rr, 0, CY + rr); g.addColorStop(0, mix(C.brand, '#ffffff', .4)); g.addColorStop(.5, C.brand); g.addColorStop(1, mix(C.brand, '#000000', .4));
        ctx.fillStyle = g; ctx.fillRect(xa, CY - rr, xb - xa, rr * 2);
        // línea helicoidal (marca que se retuerce)
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xa, CY + Math.sin(a0) * rr); ctx.lineTo(xb, CY + Math.sin(a1) * rr); ctx.stroke();
      }
      const arc = (x, dir) => { ctx.strokeStyle = C.brandXl; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(x, CY, 34, 130, 0, dir > 0 ? -1.2 : Math.PI + 1.2, dir > 0 ? 1.2 : Math.PI - 1.2, dir < 0); ctx.stroke(); };
      arc(x0 - 50, 1); arc(x0 + BL + 50, -1);
      text('Giros opuestos en los extremos', CX, CY + 220, { size: 24, weight: 700, align: 'center', alpha: .85 });
    } else {
      const sh = 56 * p, mid = x0 + BL / 2;
      ctx.fillStyle = C.brand; ctx.beginPath(); ctx.moveTo(x0, CY - BH / 2 - sh / 2); ctx.lineTo(mid, CY - BH / 2 - sh / 2); ctx.lineTo(mid, CY + BH / 2 - sh / 2); ctx.lineTo(x0, CY + BH / 2 - sh / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = mix(C.brand, '#000000', .2); ctx.beginPath(); ctx.moveTo(mid, CY - BH / 2 + sh / 2); ctx.lineTo(x0 + BL, CY - BH / 2 + sh / 2); ctx.lineTo(x0 + BL, CY + BH / 2 + sh / 2); ctx.lineTo(mid, CY + BH / 2 + sh / 2); ctx.closePath(); ctx.fill();
      arrow(x0 + BL * .25, CY + 190, x0 + BL * .25, CY + 40 - sh / 2 + 28); arrow(x0 + BL * .75, CY - 190, x0 + BL * .75, CY - 40 + sh / 2 - 28);
      ctx.strokeStyle = hexA(C.fg, .6); ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mid, CY - 150); ctx.lineTo(mid, CY + 150); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const down = pointer.down;
    if (down && !was) tabs.forEach((b, i) => { if (pointer.x > b.x && pointer.x < b.x + b.w && pointer.y > b.y && pointer.y < b.y + b.h) { forced = i; forcedAt = t; } });
    was = down;
    if (forced >= 0 && t - forcedAt > 15) forced = -1;
    const base = api.static ? SEG * 2 + 2.5 : t % (SEG * 5);
    const k = forced >= 0 ? forced : Math.floor(base / SEG), c = forced >= 0 ? (t - forcedAt) % SEG : base % SEG;
    const p = Math.sin(clamp(c / SEG) * Math.PI) ** .6 * (c < SEG ? 1 : 1);
    ctx.clearRect(0, 0, W, H);
    tabs.forEach((b, i) => {
      const on = i === k;
      ctx.fillStyle = on ? C.brand : hexA(C.fg, .12); ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 29); ctx.fill();
      text(b.n, b.x + b.w / 2, b.y + b.h / 2, { size: 24, weight: 800, align: 'center', base: 'middle', color: on ? '#ffffff' : C.fg, alpha: on ? 1 : .7 });
    });
    draw(k, p);
    text(NAMES[k], 120, 740, { size: 78, weight: 800, color: C.brand });
    text(DESC[k], 120, 794, { size: 28, weight: 700, alpha: .9 });
    text('Ejemplo: ' + EJ[k], 120, 840, { size: 26, weight: 600, alpha: .7 });
    text('Clic en una pestaña para fijar el esfuerzo', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
