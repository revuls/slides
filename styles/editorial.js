/* Editorial: a printed magazine. Serif type on paper, hairline rules instead of cards, a running head instead of a
   footer, and sidebar spreads (title on the left, content on the right). */
registerStyle(function (api) {
  const { ic, words, stmtWords, rt, pad, cell } = api;

  // Title column + content column: the signature layout of this style
  const spread = (s, cls, inner) => `<div class="inner ed-spread">${api.hd(s)}<div class="body ${cls}">${inner}</div></div>`;

  return {
    label: 'Editorial',
    description: 'printed magazine: serif type on paper, hairline rules, sidebar spreads; for essays, culture, reports and storytelling',
    theme: 'papel',
    transition: 'fade',
    fonts: ['Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..700', 'Source Sans 3:wght@300..700'],
    themes: {
      papel: { label: 'Papel', a: '#A8271D', b: '#1E1A16', vars: {
        '--brand': '#A8271D', '--brand-t': '#EC8F7F', '--brand-l': '#C9503F', '--brand-xl': '#EBC3B8', '--brand-d': '#7E1A13', '--brand-rgb': '168,39,29',
        '--ink': '#1E1A16', '--ink-rgb': '30,26,22', '--sec': '#4A5D6E', '--tint-warm': '#F5F0E6', '--tint-blue': '#ECE5D6' } }
    },

    // A kicker and a title, no pill and no accent bar
    header: s => `<header class="hd">
      ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
      <h2 data-a="up">${s.title ?? ''}</h2>
      ${s.subtitle ? `<p class="sub" data-a="up">${rt(s.subtitle)}</p>` : ''}
    </header>`,

    // Running head at the top of the page, like a magazine
    chrome: (s, c) => (c.nofoot ? '' : `<div class="ed-run"><span>${c.logo || c.deckTitle}</span><span>${c.meta.date ?? ''}</span><b>${pad(c.i + 1)}</b></div>`),

    decor: () => '',

    types: {
      cover: { theme: 'light', render: (s, c) => `
        <aside class="ed-band" data-a="fade">
          <b>${c.meta.date ?? ''}</b>
          <span>${c.meta.author ?? ''}</span>
        </aside>
        <div class="inner mid ed-cover">
          ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
          <h1 class="mega">${words(s.title)}</h1>
          ${s.subtitle ? `<p class="lead" data-a="up">${rt(s.subtitle)}</p>` : ''}
        </div>` },

      section: { render: (s, c) => `
        <div class="inner ed-section">
          <div class="ed-numeral" data-a="fade">${s.number ?? pad(c.sec)}</div>
          <div>
            ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
            <h2 class="mega md">${words(s.title)}</h2>
            ${s.subtitle ? `<p class="lead" data-a="up">${rt(s.subtitle)}</p>` : ''}
          </div>
        </div>` },

      agenda: { render: s => `<div class="inner ed-spread">
        <header class="hd"><h2 data-a="up">${s.title || 'Sumario'}</h2>${s.subtitle ? `<p class="sub" data-a="up">${rt(s.subtitle)}</p>` : ''}</header>
        <ol class="body ed-toc">${(s.items || []).slice(0, 7).map((k, i) => {
          const o = typeof k === 'string' ? { title: k } : k;
          return `<li data-a="fade"><span>${o.title}${o.desc ? `<small>${o.desc}</small>` : ''}</span><b>${pad(i + 1)}</b></li>`; }).join('')}</ol>
      </div>` },

      features: { render: s => spread(s, 'ed-rows', (s.cards || []).slice(0, 4).map((k, i) => `
        <article class="ed-row" data-a="up">
          <span class="ed-no">${pad(i + 1)}</span>
          <div><h3>${k.title}</h3><p>${rt(k.text)}</p></div>
        </article>`).join('')) },

      'number-grid': { render: s => spread(s, 'ed-rows', (s.metrics || []).slice(0, 6).map(k => `
        <article class="ed-row ed-figure" data-a="up">
          <span class="ed-val"><span class="count" data-count="${k.value}">${k.value}</span></span>
          <div><h3>${k.label ?? ''}</h3>${k.desc ? `<p>${rt(k.desc)}</p>` : ''}</div>
        </article>`).join('')) },

      quote: { theme: 'light', fx: 0, render: s => `
        <div class="inner ed-quote">
          <blockquote>${words(s.text, '28ms')}</blockquote>
          <footer data-a="up"><b>${s.author ?? ''}</b>${s.role ? `<span>${s.role}</span>` : ''}</footer>
        </div>` },

      statement: { theme: 'light', render: s => `
        <div class="inner mid ed-statement">
          ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
          <h2 class="stmt">${stmtWords(s.text || s.title)}</h2>
          ${s.source || s.author ? `<p class="ed-src" data-a="up">${s.source || s.author}</p>` : ''}
        </div>` },

      closing: { theme: 'light', render: s => {
        const ct = (s.contacts || []).map(k => (typeof k === 'string' ? { text: k } : k));
        return `<div class="inner mid ed-closing">
          <h2 class="mega md">${words(s.title || 'Gracias')}</h2>
          ${s.subtitle ? `<p class="lead" data-a="up">${rt(s.subtitle)}</p>` : ''}
          ${ct.length ? `<ul data-a="up">${ct.map(k => `<li>${ic(k.icon || 'link')}${k.text}</li>`).join('')}</ul>` : ''}
          ${s.cta ? `<p class="ed-cta" data-a="up">${s.cta}</p>` : ''}
        </div>`; } },

      // New slide type, only available in this style: a two-column article with a drop cap
      spread: { rules: { req: ['title', 'text'] }, render: s => spread(s, 'ed-article', `
        <div class="ed-cols" data-a="fade">${String(s.text).split(/\n{2,}/).map(p => `<p>${rt(p)}</p>`).join('')}</div>
        ${s.pull ? `<p class="ed-pull" data-a="up">${s.pull}</p>` : ''}`) }
    },

    css: `
:root{--font-head:'Fraunces',Georgia,serif;--font-body:'Source Sans 3',system-ui,sans-serif}
.slide{background:var(--tint-warm);--card:transparent;--shadow:none;--line:rgba(var(--ink-rgb),.24);--card-bd:rgba(var(--ink-rgb),.24);--soft:var(--tint-blue);--tag-bg:transparent;--muted:color-mix(in srgb,var(--ink) 66%,var(--tint-warm))}
.slide.dark{background:var(--ink);--card:transparent;--shadow:none;--tag-bg:transparent}
.slide.orange{background:var(--brand);--card:transparent;--shadow:none;--tag-bg:transparent}
#ptrack,#progress{height:4px}
#progress{background:var(--brand);box-shadow:none}

.t-agenda::before,.t-agenda::after,.t-section::before{display:none}

/* running head */
.ed-run{left:120px;right:120px;top:48px;display:grid;grid-template-columns:1fr auto 110px;gap:40px;padding-bottom:14px;border-bottom:1px solid var(--line);font-size:21px;color:var(--muted);letter-spacing:.03em}
.ed-run b{text-align:right;font-family:var(--font-head);font-weight:500;color:var(--fg)}
.ed-run img{height:30px;display:block}

/* type */
.mega{font-weight:500;letter-spacing:-.025em;line-height:1.04}
.lead{font-weight:300;font-size:34px}
.kicker{background:none;padding:0;border-radius:0;font-size:21px;font-weight:600;letter-spacing:.18em;margin-bottom:22px}
.hd{margin-bottom:40px}
.hd h2{font-weight:500;font-size:64px;letter-spacing:-.02em}
.hd .sub{font-size:27px;font-family:var(--font-head);font-style:italic;font-weight:300}
strong{font-weight:600}

/* cards become ruled columns */
.tilt{transform:none!important}.tilt::after{display:none}.tilt:hover{box-shadow:none}
.card{background:none;border:0;border-top:2px solid var(--fg);border-radius:0;padding:32px 4px 0;box-shadow:none}
.feat{padding:32px 4px 0}.feat::before{display:none}.feat .no{display:none}
.feat h3,.pane h3{font-family:var(--font-head);font-weight:500}
.ibub,.ibub.orange,.ibub.navy,.ibub.blue{width:auto;height:auto;background:none;box-shadow:none;color:var(--accent);justify-content:start;font-size:46px;margin-bottom:18px}
.mv{background:none;color:var(--accent);font-family:var(--font-head);font-weight:400;letter-spacing:-.03em}
.mline{display:none}
.ml,.card h3,.card h4{font-family:var(--font-head);font-weight:500}
.pane,.pane.b,.dark .pane.b{background:none;border:0;border-top:2px solid var(--fg);border-radius:0;box-shadow:none;padding:32px 4px 0}
.pane.b h3,.pane.b strong{color:var(--fg)}.pane.b p,.pane.b li{color:var(--text)}
.pane.b .pi,.dark .pane.b .pi{color:var(--accent)}
.pane.b .vs-list li i,.dark .pane.b .vs-list li i{color:var(--accent)}
.badge{display:none}
.verdict{background:none;color:var(--fg);border-radius:0;font-family:var(--font-head);font-style:italic;font-weight:400;padding:12px 0;border-bottom:2px solid var(--accent)}
.verdict i{color:var(--accent)}
.media::before{display:none}
.media .iw{border-radius:0;box-shadow:none}
.tl-node{border-radius:0;border-width:0;border-left:3px solid var(--accent);background:none;justify-content:start;font-family:var(--font-head);font-weight:400;width:auto}
.tl-node::after{display:none}
.tl-track{height:1px;top:0}
.tl-step h4{font-family:var(--font-head);font-weight:500}
.tbl{border-radius:0;box-shadow:none}
.win{border-radius:0}

/* spread: title column + content column */
.ed-spread{display:grid;grid-template-columns:540px minmax(0,1fr);column-gap:100px}
.ed-spread>.hd{margin:0;align-self:center}
.ed-spread>.hd h2{font-size:68px}
.ed-spread>.body{align-self:center;max-height:100%}
.ed-rows{display:grid;gap:0;align-content:center}
.ed-row{display:grid;grid-template-columns:96px 1fr;gap:30px;padding:30px 0;border-top:1px solid var(--line)}
.ed-row:last-child{border-bottom:1px solid var(--line)}
.ed-no{font:300 62px/1 var(--font-head);color:var(--accent)}
.ed-row h3{font:500 38px/1.15 var(--font-head);color:var(--fg);margin:0 0 10px;letter-spacing:-.01em}
.ed-row p{font-size:26px;line-height:1.45;margin:0;color:var(--text)}
.ed-figure{grid-template-columns:370px 1fr;align-items:center}
.ed-val{font:400 84px/1 var(--font-head);color:var(--accent);letter-spacing:-.03em;font-variant-numeric:lining-nums;white-space:nowrap}

/* cover */
.ed-band{right:0;top:0;bottom:0;width:400px;background:var(--brand);color:#fff;padding:0 56px 72px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;z-index:3}
.ed-band b{font:400 44px/1.1 var(--font-head)}
.ed-band span{font-size:24px;opacity:.9}
.ed-cover{padding-right:520px}
.ed-cover .mega{font-size:124px;margin-bottom:40px}

/* section */
.ed-section{display:grid;grid-template-columns:600px 1fr;column-gap:60px;align-items:center}
.ed-numeral{font:300 400px/.9 var(--font-head);color:var(--accent);letter-spacing:-.05em;font-feature-settings:'lnum'}

/* contents */
.ed-toc{list-style:none;margin:0;padding:0;display:grid;align-content:center}
.ed-toc li{display:flex;justify-content:space-between;gap:40px;align-items:baseline;padding:22px 0;border-top:1px solid var(--line);font:500 38px/1.2 var(--font-head);color:var(--fg)}
.ed-toc li:last-child{border-bottom:1px solid var(--line)}
.ed-toc small{display:block;font:400 24px/1.4 var(--font-body);color:var(--muted);margin-top:6px}
.ed-toc b{font-weight:300;color:var(--accent)}

/* quote + statement */
.ed-quote{justify-content:center;padding-left:220px;padding-right:220px}
.ed-quote blockquote{margin:0 0 48px;font:italic 300 76px/1.18 var(--font-head);color:var(--fg);letter-spacing:-.015em;text-wrap:balance}
.ed-quote footer{display:flex;gap:24px;align-items:baseline;padding-top:24px;border-top:1px solid var(--line);font-size:26px}
.ed-quote footer b{color:var(--fg);font-weight:600}
.ed-quote footer span{color:var(--muted)}
.ed-statement .stmt{font:300 92px/1.14 var(--font-head);letter-spacing:-.02em;color:var(--fg);max-width:1560px;margin:0;text-wrap:balance}
.ed-statement .stmt em{color:var(--accent);font-style:italic}
.ed-src{font-size:26px;color:var(--muted);margin:40px 0 0}

/* closing */
.ed-closing ul{list-style:none;margin:48px 0 0;padding:28px 0 0;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:16px 56px;font-size:28px}
.ed-closing li{display:flex;gap:12px;align-items:center}
.ed-closing i{color:var(--accent)}
.ed-cta{font:italic 400 40px/1.2 var(--font-head);color:var(--accent);margin:40px 0 0}

/* article (slide type "spread") */
.ed-cols{columns:2;column-gap:56px;font-size:27px;line-height:1.5}
.ed-cols p{margin:0 0 18px;color:var(--text)}
.ed-cols p:first-child::first-letter{float:left;font:400 124px/.82 var(--font-head);color:var(--accent);padding:6px 14px 0 0}
.ed-pull{font:italic 300 40px/1.25 var(--font-head);color:var(--accent);margin:28px 0 0;padding-top:24px;border-top:1px solid var(--line)}
`
  };
});
