/* Materiales — Celdillas unidad en 3D (arrastra con el ratón para girar).
   params.tipo: 'generica' | 'bcc' | 'fcc' | 'hcp'. Ciclo ≈ 22 s: puntos de red → átomos → fracciones → constante reticular.
   Geometría exacta: BCC a = 4r/√3 · FCC a = 4r/√2 · HCP a = 2r, c = 4√(2/3)·r. */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, TAU, hexA, mix, text, clamp, lerp, ease } = api;
  const TIPO = params.tipo || 'bcc';
  const BLUE = '#4aa3ff';
  const ph = (c, a, b) => clamp((c - a) / (b - a));
  const CX = 1340, CY = 600;
  let yaw = -.6, pitch = .42, lastX = null, lastY = null, idle = 0;

  /* ---------- geometría (unidades de r = 1) ---------- */
  const R3 = Math.sqrt(3), R2 = Math.sqrt(2);
  let atoms = [], edges = [], S = 1, info = {};
  if (TIPO === 'bcc' || TIPO === 'fcc' || TIPO === 'generica') {
    const a = TIPO === 'bcc' ? 4 / R3 : TIPO === 'fcc' ? 4 / R2 : 4 / R2, h = a / 2;
    S = 270 / a;
    const sg = [-1, 1];
    for (const x of sg) for (const y of sg) for (const z of sg) atoms.push({ p: [x * h, y * h, z * h], k: 'v', f: '1/8' });
    if (TIPO === 'bcc') atoms.push({ p: [0, 0, 0], k: 'c', f: '1' });
    if (TIPO === 'fcc') for (const s of sg) { atoms.push({ p: [s * h, 0, 0], k: 'f', f: '1/2' }); atoms.push({ p: [0, s * h, 0], k: 'f', f: '1/2' }); atoms.push({ p: [0, 0, s * h], k: 'f', f: '1/2' }); }
    const V = [];
    for (const x of sg) for (const y of sg) for (const z of sg) V.push([x * h, y * h, z * h]);
    V.forEach((p, i) => V.forEach((q, j) => { if (j > i && (p[0] !== q[0]) + (p[1] !== q[1]) + (p[2] !== q[2]) === 1) edges.push([p, q]); }));
  } else {
    const a = 2, c = 4 * Math.sqrt(2 / 3), hc = c / 2;
    S = 105;
    const hex = k => [a * Math.cos(k * TAU / 6), a * Math.sin(k * TAU / 6)];
    for (let k = 0; k < 6; k++) { const [x, z] = hex(k); atoms.push({ p: [x, -hc, z], k: 'v', f: '1/6' }); atoms.push({ p: [x, hc, z], k: 'v', f: '1/6' }); }
    atoms.push({ p: [0, -hc, 0], k: 'f', f: '1/2' }); atoms.push({ p: [0, hc, 0], k: 'f', f: '1/2' });
    for (let k = 0; k < 3; k++) { const ang = (k * 120 + 30) * Math.PI / 180, rr = a / R3; atoms.push({ p: [Math.cos(ang) * rr, 0, Math.sin(ang) * rr], k: 'c', f: '1' }); }
    for (let k = 0; k < 6; k++) { const [x1, z1] = hex(k), [x2, z2] = hex((k + 1) % 6); edges.push([[x1, -hc, z1], [x2, -hc, z2]], [[x1, hc, z1], [x2, hc, z2]], [[x1, -hc, z1], [x1, hc, z1]]); }
  }
  const HH = TIPO === 'hcp' ? 0 : Math.abs(atoms[0].p[0]);   // semiarista del cubo
  const TXT = {
    generica: ['Celdilla unidad: la «pieza» mínima que se repite', 'Aristas a, b, c · ángulos α, β, γ', 'Cúbica: a = b = c y α = β = γ = 90°'],
    bcc: ['n = 8 · 1/8 + 1 = 2 átomos', 'IC = 8', 'a = 4r / √3', 'FPA = 68 %'],
    fcc: ['n = 8 · 1/8 + 6 · 1/2 = 4 átomos', 'IC = 12', 'a = 4r / √2', 'FPA = 74 %'],
    hcp: ['n = 12 · 1/6 + 2 · 1/2 + 3 = 6 átomos', 'IC = 12', 'a = 2r   ·   c = 4·√(2/3)·r ≈ 3,27 r', 'FPA = 74 %']
  }[TIPO];
  const TITLE = { generica: 'Celda unitaria', bcc: 'BCC · cúbica centrada en el cuerpo', fcc: 'FCC · cúbica centrada en las caras', hcp: 'HCP · hexagonal compacta' }[TIPO];

  const proj = p => {
    let [x, y, z] = p;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const f = 1 / (1 - z2 * S / 2600);
    return { x: CX + x1 * S * f, y: CY - y2 * S * f, z: z2, f };
  };
  const sphere = (x, y, r, col, a = 1) => {
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .08, x, y, r);
    g.addColorStop(0, mix(col, '#ffffff', .55)); g.addColorStop(1, mix(col, '#000000', .38));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  };
  const colOf = k => k === 'c' ? C.brand : k === 'f' ? BLUE : mix(C.brand, '#ffffff', .25);
  const label = (s, x, y, o = {}) => {
    ctx.font = `800 ${o.size || 26}px 'Inter',sans-serif`; const w = ctx.measureText(s).width + 26;
    ctx.fillStyle = hexA(o.bg || '#000000', .62); ctx.beginPath(); ctx.roundRect(x - w / 2, y - 22, w, 44, 22); ctx.fill();
    text(s, x, y, { size: o.size || 26, weight: 800, align: 'center', base: 'middle', color: o.color || '#ffffff' });
  };
  const line3 = (p, q, col, w, dash) => {
    const a = proj(p), b = proj(q); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
  };

  function frame(dt, t) {
    t = Math.max(0, t);
    // rotación: arrastre o giro automático
    const inside = pointer.x > 900 && pointer.x < 1840 && pointer.y > 150 && pointer.y < 1000;
    if (pointer.down && inside && lastX !== null) { yaw += (pointer.x - lastX) * .008; pitch = clamp(pitch + (pointer.y - lastY) * .006, -1.2, 1.2); idle = 0; }
    else { idle += dt; if (idle > 1.5) yaw += dt * .45; }
    lastX = pointer.x > -900 ? pointer.x : null; lastY = pointer.y;
    const CYC = 22, c = api.static ? 14 : t % CYC;
    const fade = c > CYC - .6 ? clamp(1 - (c - (CYC - .6)) / .6) : 1;
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = fade;

    const fr = TIPO === 'generica' ? 1 : lerp(.27, 1, ease(ph(c, 3, 6.5)));      // radio relativo de los átomos
    const rpx = S * fr;
    // base: aristas
    edges.forEach(([p, q]) => line3(p, q, hexA(C.fg, .55), 3.5));
    if (TIPO === 'generica') {
      // rejilla de celdillas vecinas (puntos) que se desvanece al enfocar una
      const k = 1 - ease(ph(c, 2, 4.5));
      const h = HH, a = h * 2;
      if (k > 0) for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let l = -2; l <= 2; l++) {
        if (Math.abs(i) <= .5 && Math.abs(j) <= .5 && Math.abs(l) <= .5) continue;
        const q = proj([i * a, j * a, l * a]); ctx.globalAlpha = fade * k * .5; ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(q.x, q.y, 7 * q.f, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = fade;
    }
    // átomos ordenados por profundidad
    const items = atoms.map(at => ({ at, q: proj(at.p) })).sort((u, v) => u.q.z - v.q.z);
    items.forEach(({ at, q }) => {
      const gen = TIPO === 'generica';
      sphere(q.x, q.y, gen ? 11 * q.f : rpx * q.f * (at.k === 'v' && fr < 1 ? 1 : 1), gen ? C.brand : colOf(at.k), gen ? 1 : fr < 1 ? 1 : .86);
    });
    // fases de explicación
    if (TIPO === 'generica') {
      const e = ph(c, 5, 7), A = proj([-HH, -HH, HH]), Bq = proj([HH, -HH, HH]), D = proj([-HH, HH, HH]), Z = proj([-HH, -HH, -HH]);
      ctx.globalAlpha = fade * e;
      label('a', (A.x + Bq.x) / 2, (A.y + Bq.y) / 2, { bg: C.brand }); label('b', (A.x + Z.x) / 2, (A.y + Z.y) / 2, { bg: C.brand }); label('c', (A.x + D.x) / 2, (A.y + D.y) / 2, { bg: C.brand });
      ctx.globalAlpha = fade * ph(c, 8, 10);
      const ang = (P, Q, txt) => { const u = [(P.x - A.x), (P.y - A.y)], v = [(Q.x - A.x), (Q.y - A.y)], lu = Math.hypot(...u), lv = Math.hypot(...v); label(txt, A.x + (u[0] / lu + v[0] / lv) * 62, A.y + (u[1] / lu + v[1] / lv) * 62, { bg: BLUE }); };
      ang(Bq, Z, 'γ'); ang(Z, D, 'α'); ang(Bq, D, 'β');
      ctx.globalAlpha = fade;
    } else {
      // fracciones de átomo en la celdilla
      const e = ph(c, 7, 8.5) * (1 - ph(c, 12, 13));
      if (e > 0) { ctx.globalAlpha = fade * e; items.forEach(({ at, q }) => label(at.f, q.x, q.y, { bg: '#000000', size: 22 })); ctx.globalAlpha = fade; }
      // constante reticular
      const e2 = ph(c, 13, 14.5);
      if (e2 > 0) {
        ctx.globalAlpha = fade * e2;
        if (TIPO === 'bcc') {
          const h = HH, P0 = [-h, -h, -h], P1 = [h, h, h];
          line3(P0, P1, C.brandXl, 8); const m = proj([0, 0, 0]); label('D = 4r', m.x + 70, m.y - 70, { bg: C.brand });
        } else if (TIPO === 'fcc') {
          const h = HH, P0 = [-h, -h, h], P1 = [h, h, h];
          line3(P0, P1, C.brandXl, 8); const m = proj([0, 0, h]); label('d = 4r', m.x + 66, m.y - 64, { bg: C.brand });
        } else {
          const a = 2, hc = 2 * Math.sqrt(2 / 3), p0 = [a, -hc, 0], p1 = [a * Math.cos(TAU / 6), -hc, a * Math.sin(TAU / 6)];
          line3(p0, p1, C.brandXl, 9); const m = proj([(p0[0] + p1[0]) / 2, -hc, (p0[2] + p1[2]) / 2]); label('a = 2r', m.x + 20, m.y + 56, { bg: C.brand });
          line3([-a, -hc, 0], [-a, hc, 0], C.brandXl, 9); const m2 = proj([-a, 0, 0]); label('c', m2.x - 36, m2.y, { bg: C.brand });
        }
        ctx.globalAlpha = fade;
      }
      // índice de coordinación: enlaces del átomo central (8 vecinos) en BCC y de una cara en FCC
      const e3 = ph(c, 16, 17.5) * (TIPO === 'hcp' ? 0 : 1);
      if (e3 > 0) {
        ctx.globalAlpha = fade * e3;
        if (TIPO === 'bcc') atoms.filter(a => a.k === 'v').forEach(a => line3([0, 0, 0], a.p, C.brandXl, 5, [10, 8]));
        else { const h = HH, f0 = [0, 0, h]; atoms.filter(a => a.k === 'v' && a.p[2] > 0).forEach(a => line3(f0, a.p, C.brandXl, 5, [10, 8])); [[h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0]].forEach(p => line3(f0, p, C.brandXl, 5, [10, 8])); }
        ctx.globalAlpha = fade;
      }
    }
    ctx.globalAlpha = 1;

    // lectura a la izquierda, línea a línea
    const starts = TIPO === 'generica' ? [1, 5, 9] : [6.5, 15.2, 13.5, 18.3];
    const order = TIPO === 'generica' ? [0, 1, 2] : [0, 2, 1, 3];   // n → a → IC → FPA (en el orden en que aparece en la escena)
    text(TITLE, 120, 590, { size: 34, weight: 800, color: C.brand });
    order.forEach((idx, k) => {
      const s = TIPO === 'generica' ? starts[k] : [6.5, 13.5, 15.2, 18.3][k], e = api.static ? 1 : ph(c, s, s + .8);
      if (e <= 0) return;
      text(TXT[idx], 120, 660 + k * 70, { size: TIPO === 'generica' ? 30 : 36, weight: idx === 3 ? 800 : 700, alpha: e, color: idx === 3 ? C.brandXl : C.fg });
    });
    text('Arrastra para girar la celdilla', 120, 990, { size: 22, weight: 600, alpha: .5 });
  }
  return { frame };
});
