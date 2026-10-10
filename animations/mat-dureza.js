/* Materiales — Ensayos de dureza: Brinell, Vickers, Rockwell y comparativa (con Knoop).
   params.metodo: 'brinell' | 'vickers' | 'rockwell' | 'todos'. Esquemas ilustrativos, proporciones exageradas.
   Ciclo ≈ 14 s: el penetrador baja, se aplica la carga, se retira y se mide la huella. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const M = params.metodo || 'brinell';
  const BLUE = '#4aa3ff', STEEL = '#aab4c2';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const CYC = 14;
  const TAN68 = Math.tan(68 * Math.PI / 180), TAN60 = Math.tan(60 * Math.PI / 180);
  const SPEC = {
    brinell: { name: 'Brinell (HB)', hmax: 36, R: 92, f: ['HB = F / S', 'S = superficie de la huella', 'Esfera de acero templado'] },
    vickers: { name: 'Vickers (HV)', hmax: 44, H: 84, f: ['HV = F / S ≈ 1,8544 · F / d²', 'd = diagonal de la huella', 'Pirámide de diamante de 136°'] },
    rockwell: { name: 'Rockwell (HR)', hmax: 110, H: 150, f: ['HRC = 100 − e   ·   HRB = 130 − e', 'e = (h₃ − h₁) / 0,002 mm', 'Cono de diamante 120° (HRC) o bola (HRB)', 'Mayor penetración ⇒ menor dureza'] }
  };

  const block = (x0, x1, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#8a93a1'); g.addColorStop(1, '#4b5260'); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.strokeStyle = hexA('#ffffff', .5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); };
  function indenter(kind, cx, tipY, s) {
    const g = ctx.createLinearGradient(cx - 60 * s, 0, cx + 60 * s, 0); g.addColorStop(0, '#6b7280'); g.addColorStop(.45, '#e6eaf0'); g.addColorStop(1, '#5a6270');
    ctx.fillStyle = g;
    const sp = SPEC[kind];
    if (kind === 'brinell') { ctx.beginPath(); ctx.arc(cx, tipY - sp.R * s, sp.R * s, 0, TAU); ctx.fill(); ctx.fillRect(cx - 34 * s, tipY - sp.R * 2 * s - 110 * s, 68 * s, 110 * s + sp.R * s); }
    else { const tn = kind === 'vickers' ? TAN68 : TAN60, hh = sp.H * s; ctx.beginPath(); ctx.moveTo(cx, tipY); ctx.lineTo(cx - hh * tn, tipY - hh); ctx.lineTo(cx + hh * tn, tipY - hh); ctx.closePath(); ctx.fill(); ctx.fillRect(cx - Math.min(hh * tn, 150 * s) * .45, tipY - hh - 90 * s, Math.min(hh * tn, 150 * s) * .9, 90 * s + 1); }
  }
  function cavity(kind, cx, ys, hp, s, x0, x1, y1) {
    if (hp <= .5) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, ys, x1 - x0, y1 - ys); ctx.clip(); ctx.fillStyle = C.bg;
    if (kind === 'brinell') { const R = SPEC.brinell.R * s; ctx.beginPath(); ctx.arc(cx, ys + hp - R, R, 0, TAU); ctx.fill(); }
    else { const tn = kind === 'vickers' ? TAN68 : TAN60; ctx.beginPath(); ctx.moveTo(cx, ys + hp); ctx.lineTo(cx - hp * tn, ys); ctx.lineTo(cx + hp * tn, ys); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  const chord = (kind, hp, s) => kind === 'brinell' ? 2 * Math.sqrt(Math.max(0, Math.pow(SPEC.brinell.R * s, 2) - Math.pow(SPEC.brinell.R * s - hp, 2))) : 2 * hp * (kind === 'vickers' ? TAN68 : TAN60);
  const arrowH = (x0, x1, y, col, w = 4) => { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); [[x0, 1], [x1, -1]].forEach(([x, d]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * 16, y - 9); ctx.lineTo(x + d * 16, y + 9); ctx.closePath(); ctx.fill(); }); };
  const forceArrow = (x, y, f) => { if (f < .04) return; const L = 50 + f * 60; ctx.strokeStyle = C.brandXl; ctx.fillStyle = C.brandXl; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - L); ctx.lineTo(x, y - 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 18, y - 22); ctx.lineTo(x + 18, y - 22); ctx.closePath(); ctx.fill(); text('F', x + 30, y - L / 2, { size: 30, weight: 800, color: C.brandXl }); };

  /* ---- un método (vista lateral + medida) ---- */
  function single(c) {
    const sp = SPEC[M], cx = 1220, ys = 700, bx0 = 940, bx1 = 1500, by1 = 880, hmax = sp.hmax;
    // fases
    const down = ease(ph(c, 0, 1.5)), load = ph(c, 1.5, 4), unload = ease(ph(c, 5.5, 7));
    let depth = hmax * ease(load), hp = hmax * .86;
    if (c > 5.5) depth = lerp(hmax, hp, unload);
    const lift = c > 5.5 ? ease(ph(c, 6.2, 7.6)) * 200 : 0;
    let tip = ys - 230 * (1 - down) + depth - lift;
    let h1 = 0, h2 = 0, h3 = 0;
    if (M === 'rockwell') {
      // precarga (h1) → carga total (h2) → vuelve a precarga (h3)
      const a = ease(ph(c, 1.2, 2.2)), b = ease(ph(c, 2.8, 4.6)), r = ease(ph(c, 5.6, 7));
      h1 = 24; h2 = 110; h3 = 76;
      depth = c < 2.8 ? h1 * a : c < 5.6 ? lerp(h1, h2, b) : lerp(h2, h3, r);
      tip = ys - 230 * (1 - down) + depth - (c > 7.4 ? ease(ph(c, 7.4, 8.6)) * 300 : 0);
      hp = h3;
    }
    block(bx0, bx1, ys, by1);
    cavity(M, cx, ys, c > 6.5 ? hp : (c > 1.4 ? Math.max(0, depth - (M === 'rockwell' ? 0 : 0)) : 0), 1, bx0, bx1, by1);
    indenter(M, cx, tip, 1);
    const fs = M === 'rockwell' ? (c < 2.8 ? .2 * ph(c, 1.2, 2.2) : c < 5.6 ? lerp(.2, 1, ph(c, 2.8, 4.6)) : lerp(1, .2, ph(c, 5.6, 7))) : (c > 5.5 ? 1 - unload : load);
    if (c < 8.4) forceArrow(cx, tip - (M === 'brinell' ? SPEC.brinell.R * 2 + 110 : sp.H + 90) - 10, fs);
    text(sp.name, 120, 590, { size: 34, weight: 800, color: C.brand });
    // medidas
    if (M === 'rockwell') {
      const xr = cx + 190;
      const mark = (h, lab, col, a) => { if (a <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(cx + 12, ys + h); ctx.lineTo(xr + 80, ys + h); ctx.stroke(); ctx.setLineDash([]); text(lab, xr + 96, ys + h + 9, { size: 28, weight: 800, color: col }); ctx.globalAlpha = 1; };
      mark(h1, 'h₁ · precarga 10 kp', BLUE, ph(c, 2.2, 3)); mark(h2, 'h₂ · carga total', C.brandXl, ph(c, 4.6, 5.4)); mark(h3, 'h₃ · sólo precarga', '#5fd08a', ph(c, 7, 7.8));
    } else {
      const d = chord(M, hp, 1);
      if (c > 7) { const a = ph(c, 7, 8); ctx.globalAlpha = a; arrowH(cx - d / 2, cx + d / 2, ys - 30, C.brandXl); text('d', cx, ys - 46, { size: 32, weight: 800, align: 'center', color: C.brandXl }); ctx.globalAlpha = 1; }
      // vista superior
      if (c > 8.5) {
        const a = ph(c, 8.5, 9.5), px = 1660, py = 540; ctx.globalAlpha = a;
        ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.roundRect(px - 150, py - 130, 300, 260, 18); ctx.fill();
        const dd = d * .9; ctx.fillStyle = C.bg;
        if (M === 'brinell') { ctx.beginPath(); ctx.arc(px, py, dd / 2, 0, TAU); ctx.fill(); } else { const sq = dd / Math.SQRT2; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 4); ctx.fillRect(-sq / 2, -sq / 2, sq, sq); ctx.restore(); }
        arrowH(px - dd / 2, px + dd / 2, py + 110, C.brandXl); text('d', px, py + 100, { size: 28, weight: 800, align: 'center', color: C.brandXl });
        text('Vista superior de la huella', px, py + 180, { size: 22, weight: 600, align: 'center', alpha: .8 });
        ctx.globalAlpha = 1;
      }
    }
    if (c > 7.5) sp.f.forEach((l, i) => text(l, 120, 640 + i * 50, { size: i === 0 ? 40 : 26, weight: i === 0 ? 800 : 600, color: i === 0 ? C.brand : C.fg, alpha: ph(c, 7.5 + i * .3, 8.3 + i * .3) * (i === 0 ? 1 : .85) }));
    else text(c < 1.5 ? 'El penetrador se acerca a la pieza' : c < 5.5 ? 'Se aplica la carga F' : 'Se retira la carga', 120, 640, { size: 34, weight: 800, color: C.fg, alpha: .9 });
  }

  /* ---- comparativa de cuatro penetradores ---- */
  const COLS = [{ k: 'brinell', x: 1010, n: 'Brinell', s1: 'Esfera de acero', s2: 'Huella circular · HB' }, { k: 'vickers', x: 1240, n: 'Vickers', s1: 'Pirámide diamante', s2: 'Huella cuadrada · HV' },
    { k: 'rockwell', x: 1470, n: 'Rockwell', s1: 'Cono o bola', s2: 'Profundidad · HR' }, { k: 'knoop', x: 1700, n: 'Knoop', s1: 'Pirámide rómbica', s2: 'Huella romboidal · HK' }];
  function todos(c) {
    const s = .42, ys = 560, by1 = 700, press = ease(ph(c, 1, 3)) * (1 - ease(ph(c, 4, 5.5)) * .14), mark = ph(c, 5.5, 6.5);
    COLS.forEach(col => {
      const kind = col.k === 'knoop' ? 'vickers' : col.k, sp = SPEC[kind], hmax = sp.hmax * s * (col.k === 'knoop' ? .7 : 1), depth = hmax * press, drop = (1 - ease(ph(c, 0, 1))) * 120, lift = ease(ph(c, 4.6, 5.8)) * 90;
      block(col.x - 100, col.x + 100, ys, by1);
      cavity(kind, col.x, ys, c > 1.2 ? depth * (c > 4 ? .88 : 1) : 0, s, col.x - 100, col.x + 100, by1);
      indenter(kind, col.x, ys - drop + depth - lift, s);
      // vista superior
      const d = chord(kind, hmax * .88, s) * 1.0, py = 830; ctx.globalAlpha = mark;
      ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.roundRect(col.x - 90, py - 62, 180, 124, 12); ctx.fill(); ctx.fillStyle = C.bg;
      if (col.k === 'brinell' || col.k === 'rockwell') { ctx.beginPath(); ctx.arc(col.x, py, d * (col.k === 'rockwell' ? .35 : .5), 0, TAU); ctx.fill(); }
      else if (col.k === 'vickers') { ctx.save(); ctx.translate(col.x, py); ctx.rotate(Math.PI / 4); ctx.fillRect(-d * .36, -d * .36, d * .72, d * .72); ctx.restore(); }
      else { ctx.beginPath(); ctx.moveTo(col.x - 70, py); ctx.lineTo(col.x, py - 14); ctx.lineTo(col.x + 70, py); ctx.lineTo(col.x, py + 14); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
      text(col.n, col.x, 370, { size: 30, weight: 800, align: 'center', color: C.brand }); text(col.s1, col.x, 940, { size: 21, weight: 700, align: 'center', alpha: .85 }); text(col.s2, col.x, 972, { size: 20, weight: 600, align: 'center', alpha: .75 });
    });
    text(c < 1 ? 'Cuatro penetradores' : c < 5 ? 'Misma idea: presionar y medir' : 'Cada uno deja una huella distinta', 120, 700, { size: 38, weight: 800, color: C.brand });
    text('Dureza = resistencia a ser penetrado o rayado', 120, 752, { size: 26, weight: 600, alpha: .85 });
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? (M === 'rockwell' ? 10 : 9.5) : t % CYC, fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
    if (M === 'todos') todos(c); else single(c);
    ctx.globalAlpha = 1;
  }
  return { frame };
});
