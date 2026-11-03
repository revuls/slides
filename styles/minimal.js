/* Minimal: white page, square corners, black type and one accent used sparingly. No cards, shadows or gradients:
   hairlines and empty space do all the structuring. */
registerStyle(function (api) {
  const { words, stmtWords, rt, pad } = api;

  return {
    label: 'Minimal',
    description: 'very clean: white background, square corners, black type, hairlines and generous empty space; for business, product and technical talks',
    theme: 'blanco',
    transition: 'fade',
    themes: {
      blanco: { label: 'Blanco', a: '#1F4FE0', b: '#111214', vars: {
        '--brand': '#1F4FE0', '--brand-t': '#8FB0FF', '--brand-l': '#5B7FEA', '--brand-xl': '#C9D6F8', '--brand-d': '#163AA8', '--brand-rgb': '31,79,224',
        '--ink': '#111214', '--ink-rgb': '17,18,20', '--sec': '#8A8F98', '--tint-warm': '#FFFFFF', '--tint-blue': '#F5F6F7' } }
    },

    header: s => `<header class="hd">
      ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
      <h2 data-a="fade">${s.title ?? ''}</h2>
      ${s.subtitle ? `<p class="sub" data-a="fade">${rt(s.subtitle)}</p>` : ''}
    </header>`,

    // Only a logo, if the deck has one, and a small page number
    chrome: (s, c) => `${c.logo ? `<div class="logo mn-logo">${c.logo}</div>` : ''}${c.nofoot ? '' : `<div class="mn-pg">${c.i + 1}</div>`}`,

    decor: () => '',

    types: {
      cover: { theme: 'light', render: (s, c) => `
        <div class="inner mn-cover">
          ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
          <h1 class="mega">${words(s.title)}</h1>
          ${s.subtitle ? `<p class="lead" data-a="fade">${rt(s.subtitle)}</p>` : ''}
        </div>
        ${c.meta.date || c.meta.author ? `<p class="mn-meta" data-a="fade">${[c.meta.author, c.meta.date].filter(Boolean).join(' · ')}</p>` : ''}` },

      animation: { theme: 'light' },

      section: { theme: 'light', render: (s, c) => `
        <div class="inner mid mn-section">
          <div class="mn-idx" data-a="fade">${s.number ?? pad(c.sec)}</div>
          <h2 class="mega md">${words(s.title)}</h2>
          ${s.subtitle ? `<p class="lead" data-a="fade">${rt(s.subtitle)}</p>` : ''}
        </div>` },

      agenda: { render: s => `<div class="inner mn-agenda">
        <header class="hd"><h2 data-a="fade">${s.title || 'Agenda'}</h2>${s.subtitle ? `<p class="sub" data-a="fade">${rt(s.subtitle)}</p>` : ''}</header>
        <ol class="body">${(s.items || []).slice(0, 7).map((k, i) => {
          const o = typeof k === 'string' ? { title: k } : k;
          return `<li data-a="fade"><span>${pad(i + 1)}</span><div>${o.title}${o.desc ? `<small>${o.desc}</small>` : ''}</div></li>`; }).join('')}</ol>
      </div>` },

      features: { render: s => {
        const cards = (s.cards || []).slice(0, 4);
        return `<div class="inner">${api.hd(s)}<div class="body mn-cols" style="--n:${cards.length || 1}">${cards.map((k, i) => `
          <article data-a="fade">
            <span>${pad(i + 1)}</span>
            <h3>${k.title}</h3>
            <p>${rt(k.text)}</p>
          </article>`).join('')}</div></div>`; } },

      'number-grid': { render: s => {
        const m = (s.metrics || []).slice(0, 6), n = m.length > 4 ? 3 : m.length || 1;
        return `<div class="inner">${api.hd(s)}<div class="body mn-cols mn-nums" style="--n:${n}">${m.map(k => `
          <article data-a="fade">
            <div class="mn-val" style="--fs:${Math.round(Math.min(n >= 4 ? 88 : n === 3 ? 112 : 136, 1400 / n / (String(k.value).length * .62)))}px"><span class="count" data-count="${k.value}">${k.value}</span></div>
            <h3>${k.label ?? ''}</h3>
            ${k.desc ? `<p>${rt(k.desc)}</p>` : ''}
          </article>`).join('')}</div></div>`; } },

      'big-number': { theme: 'light', fx: 0, render: s => `
        <div class="inner mid mn-big">
          ${s.kicker || s.title ? `<div class="kicker" data-a="fade">${s.kicker || s.title}</div>` : ''}
          <div class="mn-bigv" data-a="fade"><span class="count" data-count="${s.value}">${s.value}</span></div>
          <h3 data-a="fade">${s.label ?? ''}</h3>
          ${s.desc ? `<p data-a="fade">${rt(s.desc)}</p>` : ''}
        </div>` },

      quote: { theme: 'light', fx: 0, render: s => `
        <div class="inner mid mn-quote">
          <h2>${words(s.text, '28ms')}</h2>
          <p data-a="fade">${s.author ?? ''}${s.role ? ` · ${s.role}` : ''}</p>
        </div>` },

      statement: { theme: 'light', render: s => `
        <div class="inner mid mn-statement">
          ${s.kicker ? `<div class="kicker" data-a="fade">${s.kicker}</div>` : ''}
          <h2 class="stmt">${stmtWords(s.text || s.title)}</h2>
          ${s.source || s.author ? `<p data-a="fade">${s.source || s.author}</p>` : ''}
        </div>` },

      closing: { theme: 'light', render: s => {
        const ct = (s.contacts || []).map(k => (typeof k === 'string' ? { text: k } : k));
        return `<div class="inner mid mn-closing">
          <h2 class="mega md">${words(s.title || 'Gracias')}</h2>
          ${s.subtitle ? `<p class="lead" data-a="fade">${rt(s.subtitle)}</p>` : ''}
          ${s.cta ? `<p class="mn-cta" data-a="fade">${s.cta}</p>` : ''}
          ${ct.length ? `<ul data-a="fade">${ct.map(k => `<li>${k.text}</li>`).join('')}</ul>` : ''}
        </div>`; } }
    },

    css: `
/* the slide itself: square, without the engine's colored glow */
#stage{border-radius:0;box-shadow:0 40px 100px -40px rgba(0,0,0,.6)}
.thumb .tv{border-radius:0}
#ptrack{display:none}
#progress{height:3px;background:var(--brand);box-shadow:none}

.slide{background:#fff;--soft:var(--tint-blue);--card:transparent;--shadow:none;--line:rgba(var(--ink-rgb),.14);--card-bd:rgba(var(--ink-rgb),.14);--muted:color-mix(in srgb,var(--ink) 58%,#fff);--tag-bg:transparent;--tag-fg:var(--muted)}
.slide.dark{background:var(--ink);--card:transparent;--shadow:none;--tag-bg:transparent;--tag-fg:var(--muted)}
.slide.orange{background:var(--brand);--card:transparent;--shadow:none;--tag-bg:transparent;--tag-fg:#fff}
.t-agenda::before,.t-agenda::after,.t-section::before{display:none}
.inner{padding:120px 140px 120px}

/* chrome */
.mn-pg{right:140px;bottom:52px;font-size:20px;color:var(--muted);font-variant-numeric:tabular-nums}
.mn-logo{top:48px;right:140px;font-size:26px;font-weight:600;letter-spacing:-.02em;color:var(--fg)}
.mn-logo img{height:36px}

/* type */
.mega{font-weight:500;letter-spacing:-.04em;line-height:1.05}
.mega.md{font-size:92px}
.lead{font-weight:400;font-size:32px;color:var(--muted)}
.kicker{background:none;padding:0;border-radius:0;font-size:22px;font-weight:500;letter-spacing:0;text-transform:none;margin-bottom:20px}
.acc{display:none}
.hd{margin-bottom:64px}
.hd h2{font-weight:500;font-size:56px;letter-spacing:-.03em;line-height:1.1}
.hd .sub{font-size:27px;margin-top:4px}
strong{font-weight:600}

/* inherited types: no boxes, no gradients */
.tilt{transform:none!important}.tilt::after{display:none}.tilt:hover,.dark .tilt:hover{box-shadow:none}
.card{background:none;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none;padding:28px 0 0}
.feat{padding:28px 0 0}.feat::before,.feat .no{display:none}
.grid,.ic-grid{gap:56px}
.feat h3,.pane h3,.card h3,.card h4,.ml,.tl-step h4{font-weight:500;letter-spacing:-.02em}
.ibub,.ibub.orange,.ibub.navy,.ibub.blue{width:auto;height:auto;border-radius:0;background:none;box-shadow:none;color:var(--fg);justify-content:start;font-size:40px;margin-bottom:18px}
.mv{background:none;color:var(--fg);font-weight:500}
.mline{display:none}
.pane,.pane.b,.dark .pane.b{background:none;border:0;border-top:1px solid var(--line);border-radius:0;box-shadow:none;padding:28px 0 0}
.pane.b h3,.pane.b strong{color:var(--fg)}.pane.b p,.pane.b li{color:var(--text)}
.pane .pi,.pane.b .pi,.dark .pane.b .pi{color:var(--fg);font-size:40px}
.vs-list li i,.pane.b .vs-list li i,.dark .pane.b .vs-list li i{color:var(--muted);font-size:32px}
.badge{display:none}
.verdict{background:none;color:var(--fg);border-radius:0;padding:12px 0;font-weight:500;border-top:1px solid var(--line)}
.media::before{display:none}
.media .iw{border-radius:0;box-shadow:none}
.bl-ic{width:auto;height:auto;border-radius:0;background:none;color:var(--muted);font-size:30px;font-weight:500}
.tl-node{width:fit-content;height:44px;border:0;border-radius:0;background:var(--bg);color:var(--muted);font-size:24px;font-weight:500;justify-content:start;padding-right:18px}
.tl-node::after{display:none}
.tl-track{top:21px;height:1px;border-radius:0}
.tl-fill{background:var(--fg)}
.tl-date{color:var(--muted);font-weight:500;font-size:21px;letter-spacing:0;text-transform:none}
.tbl{border:0;border-radius:0;box-shadow:none;background:none}
.tbl th{background:none;color:var(--muted);font-weight:500;letter-spacing:0;text-transform:none;font-size:.9em;padding:16px 24px 16px 0;border-bottom:1px solid var(--fg)}
.tbl td{padding-left:0;padding-right:24px}
.tbl tbody tr:nth-child(even) td{background:none}
.tbl td:first-child{font-weight:500}
.tbl th.hl{background:none!important;color:var(--accent)}
.tbl .hl{background:none!important;color:var(--accent)}
.chip,.chip.g,.chip.a,.chip.r{background:none;padding:0;border-radius:0;font-weight:500}
.pill{border-radius:0}
.win,.an-ov,.an-err{border-radius:0;box-shadow:none}
.plan.hot{background:var(--ink);box-shadow:none}
.plan.hot .ptag{background:var(--brand);border-radius:0}

/* columns of features and figures */
.mn-cols{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:56px;align-content:center}
.mn-cols article{border-top:1px solid var(--line);padding-top:26px}
.mn-cols span{font-size:22px;color:var(--muted);font-variant-numeric:tabular-nums}
.mn-cols h3{font-size:36px;font-weight:500;letter-spacing:-.02em;line-height:1.15;color:var(--fg);margin:64px 0 14px}
.mn-cols p{font-size:25px;line-height:1.5;color:var(--muted);margin:0}
.mn-nums h3{margin:28px 0 10px;font-size:30px}
.mn-val{font-size:var(--fs,112px);font-weight:500;letter-spacing:-.05em;line-height:1;color:var(--fg);white-space:nowrap;font-variant-numeric:tabular-nums}
.mn-cols .mn-val span{font-size:inherit;color:inherit}

/* cover */
.mn-cover{justify-content:center}
.mn-cover .mega{font-size:112px;max-width:1400px;margin-bottom:32px}
.mn-cover .lead{max-width:1100px}
.mn-meta{left:140px;z-index:2;bottom:52px;margin:0;font-size:22px;color:var(--muted)}

/* section */
.mn-idx{font-size:28px;color:var(--muted);margin-bottom:28px;font-variant-numeric:tabular-nums}
.t-section .inner{justify-content:center}
.mn-section .mega{margin-bottom:24px}

/* agenda */
.mn-agenda{display:grid;grid-template-columns:520px minmax(0,1fr);column-gap:120px}
.mn-agenda>.hd{margin:0;align-self:center}
.mn-agenda ol{list-style:none;margin:0;padding:0;align-self:center;display:block}
.mn-agenda li{display:grid;grid-template-columns:80px 1fr;padding:24px 0;border-top:1px solid var(--line);font-size:34px;font-weight:500;letter-spacing:-.015em;color:var(--fg)}
.mn-agenda li:last-child{border-bottom:1px solid var(--line)}
.mn-agenda li span{font-size:22px;font-weight:400;color:var(--muted);padding-top:9px;letter-spacing:0;font-variant-numeric:tabular-nums}
.mn-agenda small{display:block;font-size:24px;font-weight:400;letter-spacing:0;color:var(--muted);margin-top:6px}

/* big number */
.mn-bigv{font-size:300px;font-weight:500;letter-spacing:-.06em;line-height:1;color:var(--fg);margin-bottom:28px;white-space:nowrap}
.mn-big h3{font-size:44px;font-weight:500;letter-spacing:-.02em;color:var(--fg);margin:0 0 12px}
.mn-big p{font-size:28px;line-height:1.45;color:var(--muted);margin:0;max-width:1100px}

/* quote + statement */
.mn-quote h2{font-size:68px;font-weight:400;line-height:1.2;letter-spacing:-.03em;color:var(--fg);max-width:1400px;margin:0 0 40px;text-wrap:balance}
.mn-quote p,.mn-statement p{font-size:26px;color:var(--muted);margin:0}
.mn-statement .stmt{font-size:88px;font-weight:500;line-height:1.12;letter-spacing:-.04em;color:var(--fg);max-width:1500px;margin:0 0 40px;text-wrap:balance}
.mn-statement .stmt em{font-style:normal;color:var(--accent)}

/* closing */
.mn-closing .mega{margin-bottom:24px}
.mn-cta{font-size:32px;font-weight:500;color:var(--accent);margin:40px 0 0}
.mn-closing ul{list-style:none;margin:56px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:12px 56px;font-size:24px;color:var(--muted)}
`
  };
});
