/* Ordenación de burbuja: compara y mueve barras hasta ordenarlas.
   params: { count: 26, speed: 1 } */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, hexA, text } = api;
  const N = params.count || 26, SPEED = params.speed || 1;
  const X0 = 250, X1 = W - 250, BASE = H - 210, MAXH = 520;
  const step = (X1 - X0) / N, bw = step * .72;
  let bars, j, end, cmp, swp, acc, phase, wait;

  function shuffle() {
    const v = Array.from({ length: N }, (_, k) => k + 1);
    for (let k = N - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [v[k], v[r]] = [v[r], v[k]]; }
    bars = v.map((val, k) => ({ v: val, x: X0 + k * step }));
    j = 0; end = N; cmp = 0; swp = 0; acc = 0; phase = 'sort'; wait = 0;
  }
  shuffle();

  function frame(dt, t) {
    ctx.clearRect(0, 0, W, H);

    if (phase === 'sort') {
      acc += dt * SPEED;
      while (acc >= .05 && phase === 'sort') {                 // un paso cada 50 ms
        acc -= .05;
        if (j < end - 1) {
          cmp++;
          if (bars[j].v > bars[j + 1].v) { [bars[j], bars[j + 1]] = [bars[j + 1], bars[j]]; swp++; }
          j++;
        } else { end--; j = 0; if (end <= 1) phase = 'done'; }
      }
    } else { wait += dt; if (wait > 3.4) shuffle(); }           // pausa y vuelta a empezar

    bars.forEach((b, k) => {
      b.x += (X0 + k * step - b.x) * Math.min(1, dt * 16);       // desplazamiento suave
      const h = b.v / N * MAXH, sorted = phase === 'done' || k >= end;
      const active = phase === 'sort' && (k === j || k === j + 1);
      ctx.fillStyle = sorted ? C.brand : active ? C.brandXl : hexA(C.fg, .3);
      if (sorted && phase === 'done') ctx.fillStyle = hexA(C.brand, .55 + .45 * Math.sin(t * 5 - k * .5));
      ctx.beginPath(); ctx.roundRect(b.x, BASE - h, bw, h, 10); ctx.fill();
    });

    ctx.fillStyle = hexA(C.fg, .2); ctx.fillRect(X0 - 20, BASE + 8, X1 - X0 + 20, 3);
    text(`Comparaciones: ${cmp}`, X0, H - 120, { size: 32, weight: 600 });
    text(`Intercambios: ${swp}`, X0 + 420, H - 120, { size: 32, weight: 600 });
    if (phase === 'done') text('¡Ordenado!', X1, H - 120, { size: 40, weight: 800, align: 'right', color: C.brand });
  }

  return { frame };
});
