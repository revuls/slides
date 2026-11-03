/* Suizo: International Typographic Style. Heavy grotesque capitals, a hard grid that fills the slide, flat blocks of
   one color, no shadows and no rounded corners. */
registerStyle(function (api) {
  const { words, stmtWords, rt, pad, ic } = api;

  return {
    label: 'Suizo',
    description: 'bold Swiss poster: heavy capitals, hard grid that fills the slide, flat color blocks; for keynotes, launches and manifestos',
    theme: 'suizo-rojo',
    transition: 'zoom',
    fonts: ['Archivo:wght@400;500;600;800;900'],
    safe: { bottom: 1010, right: 1860 },        // this grid uses 72px margins
    themes: {
      'suizo-rojo': { label: 'Rojo', a: '#D90B14', b: '#0E0E0E', vars: {
        '--brand': '#D90B14', '--brand-t': '#FF5A5F', '--brand-l': '#F0343B', '--brand-xl': '#FFC2C4', '--brand-d': '#A5060D', '--brand-rgb': '217,11,20',
        '--ink': '#0E0E0E', '--ink-rgb': '14,14,14', '--sec': '#5A5A5A', '--tint-warm': '#F2F2EE', '--tint-blue': '#E6E6E1' } }
    },

    // Title in capitals on the left, kicker on the right, thick rule below
    header: s => `<header class="hd sz-hd">
      <div><h2 data-a="left">${s.title ?? ''}</h2>${s.subtitle ? `<p class="sub" data-a="up">${rt(s.subtitle)}</p>` : ''}</div>
      ${s.kicker ? `<div class="sz-tag" data-a="fade">${s.kicker}</div>` : ''}
    </header>`,

    // Big page number top right, deck title on the bottom edge
    chrome: (s, c) => (c.nofoot ? '' : `<div class="sz-pg">${pad(c.i + 1)}</div><div class="sz-foot">${c.logo || c.deckTitle}</div>`),

    decor: () => '',

    types: {
      cover: { theme: 'light', render: (s, c) => `
        <div class="sz-block" data-a="fade">
          ${s.kicker ? `<span>${s.kicker}</span>` : '<span></span>'}
          <div><b>${c.meta.date ?? ''}</b><small>${c.meta.author ?? ''}</small></div>
        </div>
        <div class="inner sz-cover">
          <h1 class="mega">${words(s.title)}</h1>
          ${s.subtitle ? `<p class="lead" data-a="up">${rt(s.subtitle)}</p>` : ''}
        </div>` },

      section: { theme: 'orange', render: (s, c) => `
        <div class="sz-giant" data-a="fade">${s.number ?? pad(c.sec)}</div>
        <div class="inner sz-section">
          ${s.kicker ? `<div class="sz-tag" data-a="fade">${s.kicker}</div>` : ''}
          <h2 class="mega">${words(s.title)}</h2>
          ${s.subtitle ? `<p class="lead" data-a="up">${rt(s.subtitle)}</p>` : ''}
        </div>` },

      // Columns that fill the slide, separated by rules
      features: { render: s => {
        const cards = (s.cards || []).slice(0, 4);
        return `<div class="inner">${api.hd(s)}<div class="body sz-cols" style="--n:${cards.length || 1}">${cards.map((k, i) => `
          <article data-a="up">
            <b class="sz-no">${i + 1}</b>
            <h3>${k.title}</h3>
            <p>${rt(k.text)}</p>
          </article>`).join('')}</div></div>`; } },

      // Tiles edge to edge: the first one is filled with the brand color
      'number-grid': { render: s => {
        const m = (s.metrics || []).slice(0, 6), n = m.length > 4 ? 3 : m.length || 1;
        return `<div class="inner">${api.hd(s)}<div class="body sz-tiles" style="--n:${n}">${m.map(k => `
          <article data-a="zoom">
            <div class="sz-val" style="--fs:${Math.round(Math.min(n >= 4 ? 120 : n === 3 ? 190 : 260, 1500 / n / (String(k.value).length * .68)))}px"><span class="count" data-count="${k.value}">${k.value}</span></div>
            <div><h3>${k.label ?? ''}</h3>${k.desc ? `<p>${rt(k.desc)}</p>` : ''}</div>
          </article>`).join('')}</div></div>`; } },

      quote: { theme: 'light', fx: 0, render: s => `
        <div class="sz-qcol" data-a="fade">${ic('quotes', 'fill')}</div>
        <div class="inner sz-quote">
          <h2>${words(s.text, '28ms')}</h2>
          <div class="sz-by" data-a="up"><b>${s.author ?? ''}</b>${s.role ? `<span>${s.role}</span>` : ''}</div>
        </div>` },

      statement: { theme: 'dark', render: s => `
        <div class="inner sz-statement">
          ${s.kicker ? `<div class="sz-tag" data-a="fade">${s.kicker}</div>` : ''}
          <h2 class="stmt">${stmtWords(s.text || s.title)}</h2>
          ${s.source || s.author ? `<div class="sz-by" data-a="up"><span>${s.source || s.author}</span></div>` : ''}
        </div>` },

      closing: { theme: 'orange', render: s => {
        const ct = (s.contacts || []).map(k => (typeof k === 'string' ? { text: k } : k));
        return `<div class="inner sz-closing">
          <h2 class="mega">${words(s.title || 'Gracias')}</h2>
          <div class="sz-end" data-a="up">
            <div>${s.subtitle ? `<p class="lead">${rt(s.subtitle)}</p>` : ''}${s.cta ? `<p class="lead"><b>${s.cta}</b></p>` : ''}</div>
            ${ct.length ? `<ul>${ct.map(k => `<li>${k.text}</li>`).join('')}</ul>` : ''}
          </div>
        </div>`; } }
    },

    css: `
:root{--font-head:'Archivo','Helvetica Neue',Arial,sans-serif;--font-body:'Archivo','Helvetica Neue',Arial,sans-serif}
.slide{background:var(--tint-warm);--card:transparent;--shadow:none;--line:var(--ink);--card-bd:var(--ink);--tag-bg:transparent;--muted:color-mix(in srgb,var(--ink) 68%,var(--tint-warm))}
.slide.dark{background:var(--ink);--card:transparent;--shadow:none;--tag-bg:transparent;--line:rgba(255,255,255,.5);--card-bd:rgba(255,255,255,.5)}
.slide.orange{background:var(--brand);--card:transparent;--shadow:none;--tag-bg:transparent;--line:#fff;--card-bd:#fff;--text:#fff;--muted:#fff}
#ptrack,#progress{height:12px}
#progress{background:var(--brand);box-shadow:none;transition:transform .35s linear}
.slide.orange ~ #progress{background:var(--ink)}
.inner{padding:84px 72px 96px}

/* chrome */
.sz-pg{right:72px;top:32px;font-weight:900;font-size:40px;letter-spacing:-.03em;color:var(--fg);font-variant-numeric:tabular-nums}
.sz-foot{left:72px;bottom:34px;font-size:20px;font-weight:600;color:var(--fg);letter-spacing:.02em}
.sz-foot img{height:28px;display:block}

/* header */
.sz-hd{display:flex;justify-content:space-between;align-items:flex-end;gap:60px;padding-bottom:26px;border-bottom:8px solid var(--fg);margin-bottom:0;padding-right:0}
.sz-hd h2{font-weight:900;font-size:76px;line-height:.98;letter-spacing:-.035em;text-transform:uppercase;margin:0;max-width:1400px;padding-right:80px}
.sz-hd .sub{font-size:28px;font-weight:500;color:var(--fg);margin-top:18px}
.sz-tag{font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;color:var(--accent);flex:none;max-width:360px;text-align:right}

/* type */
.mega{font-weight:900;text-transform:uppercase;letter-spacing:-.045em;line-height:.92}
.lead{font-weight:500;font-size:34px;color:var(--fg)}
.kicker{background:none;padding:0;border-radius:0;letter-spacing:.02em;font-weight:800}
.acc{display:none}
strong{font-weight:800}

/* the content area sits under the header rule */
.body{margin-top:40px}
.body.grid,.body.ic-grid,.body.split2{align-content:stretch}

/* cards become flat bordered cells */
.tilt{transform:none!important}.tilt::after{display:none}.tilt:hover{box-shadow:none}
.card{background:none;border:0;border-top:4px solid var(--fg);border-radius:0;box-shadow:none;padding:28px 8px 0}
.grid,.ic-grid{gap:32px}
.feat{padding:28px 8px 0}.feat::before{display:none}.feat .no{display:none}
.card h3,.card h4,.pane h3,.tl-step h4{font-weight:800;letter-spacing:-.02em}
.ibub,.ibub.orange,.ibub.navy,.ibub.blue{width:auto;height:auto;background:none;box-shadow:none;border-radius:0;color:var(--accent);justify-content:start;font-size:56px;margin-bottom:16px}
.mv{background:none;color:var(--accent);font-weight:900}
.mline{display:none}
.pane,.pane.b,.dark .pane.b{background:none;border:0;border-top:4px solid var(--fg);border-radius:0;box-shadow:none;padding:28px 8px 0}
.pane.b h3,.pane.b strong{color:var(--accent)}.pane.b p,.pane.b li{color:var(--text)}
.pane.b .pi,.dark .pane.b .pi,.pane.b .vs-list li i,.dark .pane.b .vs-list li i{color:var(--accent)}
.badge{display:none}
.verdict{background:var(--fg);color:var(--bg);border-radius:0;font-weight:800}
.media::before{display:none}
.media .iw{border-radius:0;box-shadow:none}
.tl-node{border-radius:0;border-width:0;background:var(--fg);color:var(--bg);font-weight:900}
.tl-node::after{display:none}
.tl-track{border-radius:0}
.tl-fill{background:var(--brand)}
.tbl{border-radius:0;box-shadow:none}
.win{border-radius:0}

/* features */
.sz-cols{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:0}
.sz-cols article{padding:12px 40px 0;border-left:2px solid var(--line);display:flex;flex-direction:column}
.sz-cols article:first-child{border-left:0;padding-left:0}
.sz-no{font-weight:900;font-size:190px;line-height:1;letter-spacing:-.06em;color:var(--accent);margin-bottom:auto}
.sz-cols h3{font-size:40px;font-weight:800;line-height:1.05;letter-spacing:-.025em;color:var(--fg);margin:24px 0 14px}
.sz-cols p{font-size:26px;line-height:1.38;color:var(--text);margin:0}

/* number grid */
.sz-tiles{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-auto-rows:1fr;gap:12px}
.sz-tiles article{background:var(--ink);color:#fff;padding:36px;display:flex;flex-direction:column;justify-content:space-between;min-height:0;--fg:#fff;--text:#fff}
.sz-tiles article:first-child{background:var(--brand)}
.sz-val{font-size:var(--fs,120px);font-weight:900;letter-spacing:-.05em;line-height:.95;white-space:nowrap;font-variant-numeric:tabular-nums}
.sz-tiles h3{font-size:34px;font-weight:800;margin:0 0 8px;letter-spacing:-.02em;color:#fff}
.sz-tiles p{font-size:24px;line-height:1.35;margin:0;color:#fff}

/* cover */
.sz-block{left:0;top:0;bottom:0;width:560px;background:var(--brand);color:#fff;padding:84px 56px 60px 72px;display:flex;flex-direction:column;justify-content:space-between;font-weight:800;z-index:3}
.sz-block span{font-size:30px;line-height:1.1;text-transform:uppercase}
.sz-block b{display:block;font-weight:900;font-size:58px;line-height:.95;letter-spacing:-.04em}
.sz-block small{display:block;font-size:24px;font-weight:500;margin-top:14px}
.sz-cover{padding-left:630px;justify-content:flex-end}
.sz-cover .mega{font-size:128px;margin:0 0 32px;max-width:none}
.sz-cover .lead{max-width:none}

/* section */
.t-agenda::after,.t-section::before{display:none}
.t-agenda::before{background:var(--brand)}
.sz-giant{right:32px;bottom:-96px;font-weight:900;font-size:680px;line-height:1;letter-spacing:-.07em;color:var(--ink);z-index:1}
.t-section .sz-section{justify-content:flex-start}
.sz-section .mega{max-width:1300px;margin-bottom:24px}
.sz-section .sz-tag{color:#fff;text-align:left;max-width:none;margin-bottom:20px}
.sz-section .lead{max-width:760px;color:#fff}

/* quote */
.sz-qcol{left:0;top:0;bottom:0;width:360px;background:var(--ink);color:var(--brand-t);display:flex;justify-content:center;padding-top:84px;font-size:200px;z-index:3}
.sz-quote{padding-left:440px;justify-content:center}
.sz-quote h2{font-weight:800;font-size:76px;line-height:1.04;letter-spacing:-.035em;color:var(--fg);margin:0 0 48px;text-wrap:balance}
.sz-by{display:flex;gap:24px;align-items:baseline;font-size:28px;color:var(--fg)}
.sz-by b{font-weight:900;text-transform:uppercase}

/* statement */
.sz-statement{justify-content:flex-end}
.sz-statement .sz-tag{text-align:left;max-width:none;margin-bottom:auto;color:var(--accent)}
.sz-statement .stmt{font-weight:900;font-size:128px;line-height:.94;letter-spacing:-.05em;text-transform:uppercase;color:#fff;margin:0;max-width:none}
.sz-statement .stmt em{font-style:normal;color:var(--brand-t)}
.sz-statement .sz-by{margin-top:36px;color:#fff}

/* closing */
.sz-closing{justify-content:space-between}
.sz-closing .mega{font-size:230px;max-width:none;margin:0}
.sz-end{display:flex;justify-content:space-between;gap:80px;align-items:flex-end;border-top:8px solid #fff;padding-top:28px}
.sz-end .lead{color:#fff;margin:0 0 10px}
.sz-end ul{list-style:none;margin:0;padding:0;font-size:28px;font-weight:600;color:#fff;text-align:right}
`
  };
});
