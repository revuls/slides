/* ============================================================
   PLANTILLA DE ANIMACIÓN A PANTALLA COMPLETA
   ------------------------------------------------------------
   Este archivo es el CUERPO de una función que recibe `api`.
   Se ejecuta cada vez que el slide se muestra (empieza desde 0)
   y se detiene al salir. Para usarlo en un slide:

     { "type": "animation",
       "title": "Título (opcional)", "caption": "Pie (opcional)",
       "src": "animations/_plantilla.js",
       "params": { "count": 80, "speed": 1 } }

   También puedes escribir el código directamente en el JSON
   (solo el CUERPO de la función, sin registerAnimation):
     "code": ["línea 1", "línea 2", ...]

   FORMATO DE ARCHIVO: todo el código va dentro de
     registerAnimation(function (api) { ... return { frame }; });
   Así el archivo se carga con una etiqueta <script> y funciona
   tanto abriendo index.html directamente como desde un servidor.

   ---------------- API disponible (`api`) ----------------
   api.ctx          contexto 2D del canvas (coordenadas 1920×1080)
   api.W, api.H     ancho y alto del lienzo (1920, 1080)
   api.canvas       el <canvas> a pantalla completa
   api.root         <div> a pantalla completa para DOM/SVG
   api.colors       { brand, brandL, brandXl, brandD, ink, sec,
                      accent, fg, bg, muted, dark }   ← siguen el tema
   api.params       objeto "params" del slide (configuración)
   api.pointer      { x, y, down }  ratón en coordenadas del lienzo
   api.static       true si es una captura (miniatura / PDF)
   api.reduced      true si el usuario pidió menos movimiento
   Utilidades: rand(a,b) randInt lerp clamp map ease TAU hexA mix
               text(str,x,y,{size,weight,color,align,base,alpha})
               clear()

   Devuelve una función frame(dt, t)  (dt y t en segundos), o un
   objeto { frame(dt,t), resize(), destroy() } si necesitas limpiar.
   ============================================================ */
registerAnimation(function (api) {
  const { ctx, W, H, colors: C, params, pointer, rand, TAU, hexA, text } = api;

  // 1) CONFIGURACIÓN (valores por defecto + "params" del JSON)
  const COUNT = params.count ?? 80;
  const SPEED = params.speed ?? 1;
  const LINK = 210;                       // distancia máxima para unir puntos

  // 2) ESTADO inicial
  const dots = Array.from({ length: COUNT }, () => ({
    x: rand(W), y: rand(H), vx: rand(-50, 50), vy: rand(-50, 50), r: rand(4, 11)
  }));

  // 3) FOTOGRAMA: se llama ~60 veces por segundo
  function frame(dt, t) {
    ctx.clearRect(0, 0, W, H);

    for (const d of dots) {
      // interacción: el ratón atrae suavemente los puntos
      const dx = pointer.x - d.x, dy = pointer.y - d.y, dist = Math.hypot(dx, dy);
      if (dist < 320 && dist > 1) { d.vx += dx / dist * 120 * dt; d.vy += dy / dist * 120 * dt; }

      d.x += d.vx * SPEED * dt; d.y += d.vy * SPEED * dt;
      if (d.x < 0 || d.x > W) d.vx *= -1;           // rebote en los bordes
      if (d.y < 0 || d.y > H) d.vy *= -1;
    }

    // líneas entre puntos cercanos
    ctx.lineWidth = 2;
    for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i], b = dots[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < LINK) {
        ctx.strokeStyle = hexA(C.brand, (1 - dist / LINK) * .6);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    // puntos
    for (const d of dots) { ctx.fillStyle = C.brand; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); }

    text('Tu animación aquí', W / 2, H / 2, { size: 72, weight: 800, align: 'center', base: 'middle', alpha: .9 });
  }

  return { frame };
});
