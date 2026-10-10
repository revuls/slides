/* Materiales — Elasticidad, plasticidad y fragilidad: tres probetas sometidas a la misma carga y descarga.
   Esquema cualitativo (deformaciones exageradas). Ciclo 14 s. Mueve el ratón sobre una probeta para ver su nombre. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, pointer, TAU, hexA, mix, text, clamp, lerp } = api;
  const BLUE = '#4aa3ff', GREY = '#c9ced6';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const CYC = 14;
  const COLS = [{ x: 1060, name: 'Elástico', col: BLUE, ok: 'Recupera su forma' }, { x: 1360, name: 'Plástico', col: C.brand, ok: 'Deformación permanente' }, { x: 1660, name: 'Frágil', col: GREY, ok: 'Se rompe casi sin deformarse' }];
  const Y0 = 300, L0 = 190, CH = { y: 720, h: 150, w: 210 };
  const BREAK = .78;

  // σ (0..1) y deformación ε para cada comportamiento y fase de carga
  function state(kind, c) {
    const s = c < 6 ? ph(c, 1, 5) : 1 - ph(c, 6, 9);           // carga relativa
    const loading = c < 6;
    if (kind === 0) return { s, e: .16 * s, broken: false };
    if (kind === 1) {
      const eMax = .08 + (1 - .5) * .9;
      const e = loading ? (s <= .5 ? .16 * s : .08 + (s - .5) * .9) : eMax - .16 * (1 - s);
      return { s, e, broken: false };
    }
    const sb = Math.min(s, BREAK);
    const broken = loading ? s >= BREAK : true;
    return { s: broken && !loading ? 0 : sb, e: broken ? 0 : .05 * s, broken, sBreak: BREAK };
  }

  function bar(x, kind, c) {
    const st = state(kind, c), col = COLS[kind].col;
    const len = L0 * (1 + st.e), w = kind === 1 ? 62 * (1 - .32 * clamp((st.e - .08) / .45)) : 62;
    ctx.fillStyle = '#6b7280'; ctx.fillRect(x - 70, Y0 - 24, 140, 24);                           // soporte fijo
    ctx.fillStyle = col;
    if (kind === 2 && st.broken) {
      const dy = ph(c, kind === 2 ? 1 + 4 * BREAK : 0, 7) * 0;                                  // marcador (sin usar)
      const fall = clamp((c - (1 + 4 * BREAK)) / 1.2);
      ctx.fillRect(x - w / 2, Y0, w, L0 * .5);
      ctx.save(); ctx.translate(x, Y0 + L0 * .5 + 4 + fall * fall * 220); ctx.rotate(fall * .5); ctx.globalAlpha = 1 - fall * .7; ctx.fillRect(-w / 2, 0, w, L0 * .5); ctx.restore();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, Y0 + L0 * .5); ctx.lineTo(x - w / 6, Y0 + L0 * .5 + 8); ctx.lineTo(x + w / 6, Y0 + L0 * .5 - 6); ctx.lineTo(x + w / 2, Y0 + L0 * .5 + 4); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.roundRect(x - w / 2, Y0, w, len, 6); ctx.fill();
      // marcas de referencia
      ctx.strokeStyle = hexA('#000000', .35); ctx.lineWidth = 3;
      for (let i = 1; i < 5; i++) { const yy = Y0 + len * i / 5; ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); }
      // longitud original
      ctx.strokeStyle = hexA(C.fg, .55); ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 100, Y0 + L0); ctx.lineTo(x + 100, Y0 + L0); ctx.stroke(); ctx.setLineDash([]);
      // fuerza
      if (st.s > .02) { const ay = Y0 + len + 18, al = 18 + st.s * 70; ctx.strokeStyle = C.brandXl; ctx.fillStyle = C.brandXl; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, ay + al); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 18, ay + al); ctx.lineTo(x + 18, ay + al); ctx.lineTo(x, ay + al + 26); ctx.fill(); text('F', x + 30, ay + al / 2 + 8, { size: 28, weight: 800, color: C.brandXl }); }
    }
  }

  // minigráfica σ-ε con el recorrido del punto
  function chart(x, kind, c) {
    const x0 = x - CH.w / 2, y0 = CH.y;
    ctx.strokeStyle = hexA(C.fg, .5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + CH.h); ctx.lineTo(x0 + CH.w, y0 + CH.h); ctx.stroke();
    text('σ', x0 - 14, y0 + 8, { size: 24, weight: 700, align: 'right', alpha: .7 }); text('ε', x0 + CH.w + 8, y0 + CH.h + 8, { size: 24, weight: 700, alpha: .7 });
    const col = COLS[kind].col;
    ctx.strokeStyle = hexA(col, .9); ctx.lineWidth = 5; ctx.beginPath();
    let first = true;
    for (let k = 0; k <= 140; k++) {
      const cc = k / 140 * Math.min(c, 9.2), st = state(kind, cc); if (st.broken && kind === 2 && cc > 1 + 4 * BREAK + .05) break;
      const px = x0 + st.e / .6 * CH.w, py = y0 + CH.h - st.s * CH.h * .9;
      first ? ctx.moveTo(px, py) : ctx.lineTo(px, py); first = false;
    }
    ctx.stroke();
    const st = state(kind, Math.min(c, 9.2)), px = x0 + st.e / .6 * CH.w, py = y0 + CH.h - st.s * CH.h * .9;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill();
    if (kind === 1) { const lx = x0 + .08 / .6 * CH.w, ly = y0 + CH.h - .5 * CH.h * .9; ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.arc(lx, ly, 7, 0, TAU); ctx.fill(); text('límite elástico', lx + 12, ly - 10, { size: 20, weight: 700, alpha: .9 }); }
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? 9.5 : t % CYC, fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
    COLS.forEach((k, i) => {
      bar(k.x, i, c); chart(k.x, i, c);
      const hov = Math.abs(pointer.x - k.x) < 140 && pointer.y > 240 && pointer.y < 920;
      text(k.name, k.x, 960, { size: 34, weight: 800, align: 'center', color: k.col, alpha: hov ? 1 : .9 });
      if (c > 9.4) text(k.ok, k.x, 996, { size: 24, weight: 700, align: 'center', alpha: ph(c, 9.4, 10.2) });
    });
    const msg = c < 1 ? 'Sin carga' : c < 5 ? 'Aplicamos carga…' : c < 6 ? 'Máxima carga' : c < 9 ? 'Retiramos la carga…' : 'Resultado';
    text(msg, 120, 740, { size: 44, weight: 800, color: C.brand });
    ['Elástico: recupera su forma', 'Plástico: deformación permanente', 'Frágil: rompe casi sin deformarse'].forEach((m, i) => text(m, 120, 794 + i * 38, { size: 25, weight: 600, alpha: .85 }));
    ctx.globalAlpha = 1;
  }
  return { frame };
});
