/* Materiales — Ensayos tecnológicos: plegado y embutición.
   params.ensayo: 'plegado' | 'embuticion'. Esquemas ilustrativos (valores en mm de ejemplo). Ciclo 13 s. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const E = params.ensayo || 'plegado';
  const BLUE = '#4aa3ff', GRN = '#5fd08a', RED = '#ff5d5d';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const CYC = 13;

  /* ---- plegado: la probeta se dobla en U alrededor de un mandril ---- */
  function bend(cx, cy, phi, col, brittle, label, sub) {
    const rm = 54, tk = 32, rc = rm + tk / 2, a = phi / 2, LEG = 250;
    const pt = th => [cx + rc * Math.cos(th), cy + rc * Math.sin(th)];
    const th0 = -Math.PI / 2 - a, th1 = -Math.PI / 2 + a;
    const p0 = pt(th0), p1 = pt(th1), d0 = [-Math.cos(a), Math.sin(a)], d1 = [Math.cos(a), Math.sin(a)];
    // mandril
    const g = ctx.createRadialGradient(cx - 14, cy - 14, 6, cx, cy, rm); g.addColorStop(0, '#f1f3f6'); g.addColorStop(1, '#5a6270'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rm, 0, TAU); ctx.fill();
    ctx.fillRect(cx - 18, cy - 290, 36, 240);
    // probeta (línea media)
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.lineWidth = tk; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(p0[0] + d0[0] * LEG, p0[1] + d0[1] * LEG); ctx.lineTo(p0[0], p0[1]); ctx.arc(cx, cy, rc, th0, th1); ctx.lineTo(p1[0] + d1[0] * LEG, p1[1] + d1[1] * LEG); ctx.stroke();
    // cara exterior (tracción)
    ctx.lineWidth = 5; ctx.strokeStyle = hexA('#ffffff', .8); ctx.beginPath(); ctx.arc(cx, cy, rc + tk / 2 - 2, th0, th1); ctx.stroke();
    // grietas
    const open = brittle ? clamp((phi - .5 * Math.PI) / (.5 * Math.PI)) : 0;
    if (open > 0) for (let i = 1; i <= 6; i++) { const th = th0 + (th1 - th0) * i / 7, [x, y] = pt(th), ux = Math.cos(th), uy = Math.sin(th); ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + ux * (tk / 2 + 8), y + uy * (tk / 2 + 8)); ctx.lineTo(x + ux * (tk / 2 - 6 - open * 16), y + uy * (tk / 2 - 6 - open * 16)); ctx.stroke(); }
    text(label, cx, 905, { size: 30, weight: 800, align: 'center', color: brittle ? RED : GRN });
    text(sub, cx, 945, { size: 22, weight: 600, align: 'center', alpha: .85 });
  }
  function plegado(c) {
    const phi = ease(ph(c, 1, 8)) * Math.PI * .98;
    bend(1130, 500, phi, GRN, false, 'Material dúctil', 'Sin grietas en la cara exterior');
    bend(1590, 500, phi, '#c9ced6', true, 'Poca ductilidad', 'Grietas en la cara exterior');
    ctx.setLineDash([8, 8]); ctx.strokeStyle = hexA(C.fg, .4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1360, 300); ctx.lineTo(1360, 940); ctx.stroke(); ctx.setLineDash([]);
    text(c < 1 ? 'La probeta se dobla alrededor de un mandril' : c < 8 ? 'Doblamos en condiciones normalizadas…' : 'Observamos la parte exterior de la curva', 120, 650, { size: 32, weight: 800, color: C.brand });
    text('Allí los esfuerzos de tracción son elevados', 120, 700, { size: 26, weight: 600, alpha: .85 });
    text('Si aparecen grietas: plasticidad insuficiente', 120, 746, { size: 26, weight: 600, alpha: .85 });
  }

  /* ---- embutición: un punzón empuja la chapa hasta que aparece la primera grieta ---- */
  function embut(c) {
    const cx = 1380, ys = 650, half = 150, DC = 150;
    const d = ease(ph(c, 1, 7)) * DC * (1 - ease(ph(c, 9, 11.5)) * .0);
    const cracked = c >= 7 && c < 12;
    const up = ease(ph(c, 9.2, 11.5));
    const dd = c > 9.2 ? lerp(DC, 0, up) * 0 + DC : d;     // la chapa queda embutida (deformación permanente)
    const punchTip = ys + dd - up * 200, sheetD = dd;
    // matriz y pisador
    ctx.fillStyle = '#6b7280'; ctx.fillRect(1000, ys + 10, cx - half - 1000, 150); ctx.fillRect(cx + half, ys + 10, 1760 - cx - half, 150);
    ctx.fillStyle = '#8a93a1'; ctx.fillRect(1000, ys - 90, cx - half - 1000, 80); ctx.fillRect(cx + half, ys - 90, 1760 - cx - half, 80);
    text('Matriz', 1100, ys + 100, { size: 22, weight: 700, align: 'center', color: '#ffffff' }); text('Pisador', 1100, ys - 40, { size: 22, weight: 700, align: 'center', color: '#ffffff' });
    // chapa
    ctx.lineWidth = 14; ctx.strokeStyle = GRN; ctx.lineJoin = 'round'; ctx.beginPath();
    const N = 60; let broke = false;
    for (let i = 0; i <= N; i++) { const x = 1000 + (1760 - 1000) * i / N, dx = Math.abs(x - cx), y = ys - 2 + (dx < half ? sheetD * Math.cos(Math.PI / 2 * dx / half) : 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // punzón (vástago) con punta redonda
    const g = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0); g.addColorStop(0, '#6b7280'); g.addColorStop(.5, '#eef1f5'); g.addColorStop(1, '#5a6270'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - 64, punchTip - 64 - 230); ctx.lineTo(cx - 64, punchTip - 64); ctx.arc(cx, punchTip - 64, 64, Math.PI, 0, true); ctx.lineTo(cx + 64, punchTip - 64 - 230); ctx.closePath(); ctx.fill();
    // grieta
    if (cracked) { const a = ph(c, 7, 7.6); ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 30, ys + sheetD + 8); ctx.lineTo(cx - 12, ys + sheetD - 6 + 14); ctx.lineTo(cx + 8, ys + sheetD + 10); ctx.lineTo(cx + 30, ys + sheetD - 2); ctx.stroke(); if (Math.sin(c * 10) > -.2) text('¡Primera grieta!', cx + 70, ys + sheetD + 70, { size: 32, weight: 800, color: RED, alpha: a }); }
    // regla de penetración
    const rx = 1800; ctx.strokeStyle = hexA(C.fg, .6); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx, ys); ctx.lineTo(rx, ys + DC + 20); ctx.stroke();
    for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(rx - 10, ys + DC * i / 5); ctx.lineTo(rx + 10, ys + DC * i / 5); ctx.stroke(); }
    ctx.fillStyle = C.brandXl; ctx.beginPath(); ctx.moveTo(rx - 30, ys + Math.min(d, DC)); ctx.lineTo(rx - 8, ys + Math.min(d, DC) - 12); ctx.lineTo(rx - 8, ys + Math.min(d, DC) + 12); ctx.fill();
    const mm = (Math.min(d, DC) / DC * 9.0).toFixed(1).replace('.', ',');
    text('Penetración del punzón', 1620, 330, { size: 26, weight: 700, align: 'center', alpha: .85 });
    text(mm + ' mm', 1620, 400, { size: 64, weight: 800, align: 'center', color: cracked ? RED : C.brandXl });
    text('valor ilustrativo', 1620, 436, { size: 20, weight: 600, align: 'center', alpha: .55 });
    text(c < 1 ? 'Chapa sujeta entre matriz y pisador' : c < 7 ? 'El punzón presiona la chapa…' : 'Medimos la penetración hasta la primera grieta', 120, 650, { size: 32, weight: 800, color: C.brand });
    text('Grado de embutición = penetración en mm', 120, 700, { size: 26, weight: 600, alpha: .85 });
  }

  function frame(dt, t) {
    t = Math.max(0, t);
    const c = api.static ? 9.5 : t % CYC, fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;
    if (E === 'embuticion') embut(c); else plegado(c);
    ctx.globalAlpha = 1;
  }
  return { frame };
});
