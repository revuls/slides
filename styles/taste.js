/* Taste: art direction dealt by tasteskill v2 ("Type and nothing else", Red Hat, "Putty and black"). Words, colour and
   space carry the slide: a headline cut by the seam of two fields, whole chapters in one flat colour, one figure that
   owns the screen. No cards, icons, index numbers, thin rules, gradients or shadows. */
registerStyle(function (api) {
  const { words, stmtWords, rt, strip, ic } = api;
  const plain = t => String(strip(String(t ?? ''))).trim();

  // Black capitals: the largest size that keeps a text inside `w` in about `lines` lines
  const fit = (t, lines, max, w = 1776) => {
    const x = plain(t), long = Math.max(1, ...x.split(/\s+/).map(y => y.length));
    const per = lines > 1 ? Math.ceil(x.length / lines) + 3 : x.length;
    return Math.round(Math.min(max, w / (Math.max(per, long, 1) * .64)));
  };
  // Running text: the size that fills an area of `area` px² without going under `min`
  const fill = (t, area, min, max) => Math.round(Math.max(min, Math.min(max, Math.sqrt(area / (Math.max(plain(t).length, 1) * .6)))));
  // A figure on one line
  const fig = (v, w, max) => Math.round(Math.min(max, w / (Math.max(String(v ?? '').length, 1) * .64)));
  const rows = (list, head, text, cls = '') => {
    const n = list.length, fs = n <= 3 ? 80 : n === 4 ? 68 : n === 5 ? 56 : 48;
    return `<div class="ta-rows ${cls}" style="--fs:${fs}px">${list.map(k => `
      <div class="ta-row" data-a="up"><h3>${k[head] ?? ''}</h3>${k[text] ? `<p>${rt(k[text])}</p>` : ''}</div>`).join('')}</div>`;
  };

  return {
    label: 'Taste',
    description: 'flat type-only look from tasteskill: black capitals in Red Hat, a headline cut by the seam of two colour fields, one figure per screen, no cards or icons; for talks where words and numbers carry the slide',
    theme: 'masilla',
    transition: 'fade',
    fonts: ['Red+Hat+Display:wght@500;700;900', 'Red+Hat+Text:wght@400;500;700'],
    safe: { bottom: 1010, right: 1860 },        // 72px margins

    // Capitals on the left, the kicker as a plain note on the right: never a label above the heading
    header: s => `<header class="hd ta-hd">
      <div><h2 data-a="left">${s.title ?? ''}</h2>${s.subtitle ? `<p class="sub" data-a="up">${rt(s.subtitle)}</p>` : ''}</div>
      ${s.kicker ? `<div class="ta-note" data-a="fade">${s.kicker}</div>` : ''}
    </header>`,

    chrome: (s, c) => (c.nofoot ? '' : `<div class="ta-foot">${c.logo || c.deckTitle}</div><div class="ta-pg">${c.i + 1}</div>`),

    decor: () => '',

    types: {
      // The title stands on the seam and changes ink as it crosses it
      cover: { theme: 'light', fx: 0, render: (s, c) => {
        const fs = fit(s.title, 2, 190);
        return `
        <div class="ta-low" data-a="fade"></div>
        <h1 class="ta-cut a" style="--fs:${fs}px" data-a="fade"><span>${s.title ?? ''}</span></h1>
        <div class="ta-cut b" style="--fs:${fs}px" aria-hidden="true" data-a="fade"><span>${s.title ?? ''}</span></div>
        <div class="inner ta-cover">
          <div class="ta-top">${s.kicker ? `<span data-a="fade">${s.kicker}</span>` : '<span></span>'}${c.logo ? `<span data-a="fade">${c.logo}</span>` : ''}</div>
          <div class="ta-bot">
            ${s.subtitle ? `<p data-a="up">${rt(s.subtitle)}</p>` : '<p></p>'}
            <div data-a="up"><b>${c.meta.date ?? ''}</b><span>${c.meta.author ?? ''}</span></div>
          </div>
        </div>`; } },

      // Every chapter is one flat field: accent and ink take turns
      section: { theme: 'orange', fx: 0, render: (s, c) => `
        <div class="ta-chap ${c.sec % 2 ? '' : 'alt'}"></div>
        <div class="inner ta-sec">
          <div class="ta-top">${s.kicker ? `<span data-a="fade">${s.kicker}</span>` : '<span></span>'}</div>
          <div>
            ${s.subtitle ? `<p class="ta-sec-sub" data-a="up">${rt(s.subtitle)}</p>` : ''}
            <h2 class="ta-giant" style="--fs:${fit(s.title, 2, 230)}px">${words(s.title)}</h2>
          </div>
        </div>` },

      agenda: { fx: 0, render: s => {
        const it = (s.items || []).slice(0, 7).map(k => (typeof k === 'string' ? { title: k } : k));
        return `<div class="inner">${api.hd({ title: s.title || 'Agenda', subtitle: s.subtitle })}
          <div class="body">${rows(it, 'title', 'desc', 'ta-ag')}</div></div>`; } },

      // A list of capabilities set large, one per line
      features: { fx: 0, render: s => `<div class="inner">${api.hd(s)}<div class="body">${rows((s.cards || []).slice(0, 6), 'title', 'text')}</div></div>` },

      // One figure owns the screen; the others follow it, small
      'number-grid': { fx: 0, render: s => {
        const m = s.metrics || [], [a, ...r] = m.slice(0, 6);
        if (!a) return `<div class="inner">${api.hd(s)}</div>`;
        const small = r.length > 3 ? 60 : 88;
        return `<div class="inner">${api.hd(s)}<div class="body ta-nums ${r.length ? '' : 'solo'}">
          <div class="ta-lead" data-a="up">
            <div class="ta-fig" style="--fs:${fig(a.value, r.length ? 980 : 1776, r.length ? 300 : 420)}px"><span class="count" data-count="${a.value}">${a.value}</span></div>
            <h3>${a.label ?? ''}</h3>${a.desc ? `<p>${rt(a.desc)}</p>` : ''}
          </div>
          ${r.length ? `<div class="ta-rest">${r.map(k => `<div data-a="up">
            <div class="ta-fig" style="--fs:${fig(k.value, 660, small)}px"><span class="count" data-count="${k.value}">${k.value}</span></div>
            <div><h3>${k.label ?? ''}</h3>${k.desc ? `<p>${rt(k.desc)}</p>` : ''}</div>
          </div>`).join('')}</div>` : ''}
        </div></div>`; } },

      'big-number': { theme: 'light', fx: 0, render: (s, c) => (s.image ? api.base.types['big-number'].render(s, c) : `
        <div class="inner ta-bign">
          ${s.kicker || s.title ? `<h2 data-a="fade">${s.kicker || s.title}</h2>` : '<span></span>'}
          <div>
            <div class="ta-fig" style="--fs:${fig(s.value, 1776, 520)}px" data-a="up"><span class="count" data-count="${s.value}">${s.value}</span></div>
            <div class="ta-bign-t" data-a="up"><h3>${s.label ?? ''}</h3>${s.desc ? `<p>${rt(s.desc)}</p>` : ''}</div>
          </div>
        </div>`) },

      quote: { theme: 'orange', fx: 0, render: s => `
        <div class="inner ta-quote">
          <h2 style="--fs:${fill(s.text, 1776 * 680, 56, 168)}px">${words(s.text, '28ms')}</h2>
          <div class="ta-by" data-a="up"><b>${s.author ?? ''}</b>${s.role ? `<span>${s.role}</span>` : ''}</div>
        </div>` },

      statement: { theme: 'dark', fx: 0, render: s => `
        <div class="inner ta-state">
          ${s.kicker ? `<div class="ta-note" data-a="fade">${s.kicker}</div>` : '<span></span>'}
          <h2 class="stmt" style="--fs:${fill(s.text || s.title, 1776 * 640, 64, 168)}px">${stmtWords(s.text || s.title)}</h2>
          ${s.source || s.author ? `<div class="ta-by" data-a="up"><span>${s.source || s.author}</span></div>` : '<span></span>'}
        </div>` },

      // The closing word fills the width at the foot of an accent field
      closing: { theme: 'orange', fx: 0, render: s => {
        const ct = (s.contacts || []).map(k => (typeof k === 'string' ? { text: k } : k));
        return `<div class="inner ta-end">
          <div class="ta-end-top" data-a="up">
            <div>${s.subtitle ? `<p>${rt(s.subtitle)}</p>` : ''}${s.cta ? `<p><b>${s.cta}</b> ${ic('arrow-up-right', 'bold')}</p>` : ''}</div>
            ${ct.length ? `<ul>${ct.map(k => `<li>${k.text}</li>`).join('')}</ul>` : ''}
          </div>
          <h2 class="ta-giant" style="--fs:${fit(s.title || 'Gracias', 1, 420)}px">${words(s.title || 'Gracias')}</h2>
        </div>`; } }
    },

    css: `
:root{--font-head:'Red Hat Display','Helvetica Neue',Arial,sans-serif;--font-body:'Red Hat Text','Helvetica Neue',Arial,sans-serif}
.slide{--card:var(--surface,color-mix(in srgb,var(--tint-warm) 70%,var(--tint-blue)));--soft:var(--card);--card-bd:transparent;--shadow:none;--text:var(--ink);--tag-bg:transparent;--tag-fg:var(--fg);
  background:var(--ground,color-mix(in srgb,var(--tint-warm) 55%,#fff))}
.slide.dark{--card:var(--night,rgba(255,255,255,.08));--soft:var(--card);--card-bd:transparent;--shadow:none;--text:rgba(255,255,255,.88);--tag-bg:transparent;background:var(--ink)}
.slide.orange{--card:rgba(255,255,255,.14);--soft:var(--card);--card-bd:transparent;--shadow:none;--text:#fff;--tag-bg:transparent;background:var(--brand)}
#progress{background:var(--brand);box-shadow:none}
.inner{padding:84px 72px 96px}
.body{margin-top:44px}

/* chrome */
.ta-foot{left:72px;bottom:38px;font-size:20px;font-weight:500;color:var(--muted)}
.ta-foot img{height:30px;display:block}
.ta-pg{right:72px;bottom:38px;font-size:20px;font-weight:700;color:var(--fg);font-variant-numeric:tabular-nums}

/* header */
.ta-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:60px;margin:0;padding:0}
.ta-hd h2{font-weight:900;font-size:66px;line-height:.98;letter-spacing:-.03em;text-transform:uppercase;margin:0;max-width:1420px;text-wrap:balance}
.ta-hd .sub{font-size:28px;line-height:1.35;color:var(--muted);margin-top:18px;max-width:1300px}
.ta-note{flex:none;max-width:300px;font-size:24px;font-weight:500;line-height:1.25;color:var(--muted);text-align:right;padding-top:8px}

/* type and inherited parts */
.mega{font-weight:900;text-transform:uppercase;letter-spacing:-.03em;line-height:.92}
.lead{font-size:32px;color:var(--text)}
.kicker{background:none;padding:0;border-radius:0;letter-spacing:0;text-transform:none;font-size:24px;font-weight:500;color:var(--muted)}
.acc,.mline,.badge,.feat::before,.feat .no,.t-section::before,.t-agenda::before,.t-agenda::after,.media::before,.b-fill::after{display:none}
.tilt{transform:none!important}.tilt::after{display:none}.tilt:hover{box-shadow:none}
.card{background:var(--card);border:0;border-radius:0;box-shadow:none}
.card h3,.card h4,.pane h3,.tl-step h4{font-family:var(--font-head);font-weight:900;letter-spacing:-.02em}
.ibub,.ibub.orange,.ibub.navy,.ibub.blue{width:auto;height:auto;background:none;box-shadow:none;border-radius:0;color:var(--fg);justify-content:start;font-size:52px;margin-bottom:14px}
.mv,.bn-v span{background:none;color:var(--fg);filter:none;font-family:var(--font-head);font-weight:900;letter-spacing:-.03em}
.orange .mv{color:#fff}
.pane{background:var(--card);border:0;border-radius:0;box-shadow:none}
.pane.b{background:var(--ink);box-shadow:none}
.dark .pane.b{background:var(--brand)}
.verdict,.win,.plan,.plan.hot,.media .iw,.tbl,.tl-track{border-radius:0;box-shadow:none}
.plan.hot{background:var(--brand)}
.verdict{background:var(--fg);color:var(--bg);font-weight:700}
.tl-node{border-radius:0;border-width:0;background:var(--fg);color:var(--bg);font-weight:900}
.tl-node::after{display:none}
.tl-fill,.b-fill,.onode.root{background:var(--bc,var(--brand));box-shadow:none}
.tbl th.hl{background:var(--brand)!important}
.disc .d-o{background:var(--brand);box-shadow:none}
.t-agenda .foot{color:var(--muted)}
.pr{padding-right:12px}
.gi,.onode,.cl-list li,.cmp,.cmpw,.vph,.t-video .win{border-radius:0;box-shadow:none}
.gi:nth-child(odd),.gi:nth-child(even){margin:0}

/* large rows instead of cards */
.body:has(>.ta-rows){display:flex}
.ta-rows{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-evenly;gap:18px}
.ta-row{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:56px;align-items:baseline}
.ta-row h3{font-family:var(--font-head);font-weight:900;font-size:var(--fs);line-height:.96;letter-spacing:-.03em;text-transform:uppercase;color:var(--fg);margin:0;text-wrap:balance}
.ta-row p{font-size:27px;line-height:1.35;color:var(--text);margin:0}

/* figures */
.ta-fig{font-family:var(--font-head);font-weight:900;font-size:var(--fs);line-height:.86;letter-spacing:-.04em;color:var(--fg);white-space:nowrap;font-variant-numeric:lining-nums tabular-nums}
.ta-nums{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:72px;align-items:stretch}
.ta-nums.solo{grid-template-columns:1fr}
.ta-lead{display:flex;flex-direction:column;justify-content:flex-end;min-width:0}
.ta-lead h3{font-family:var(--font-head);font-weight:900;font-size:40px;line-height:1.05;letter-spacing:-.02em;color:var(--fg);margin:30px 0 10px}
.ta-lead p{font-size:27px;line-height:1.35;color:var(--text);margin:0;max-width:860px}
.ta-rest{display:flex;flex-direction:column;justify-content:flex-end;gap:34px;min-width:0}
.ta-rest h3{font-size:27px;font-weight:700;line-height:1.2;color:var(--fg);margin:10px 0 2px}
.ta-rest p{font-size:24px;line-height:1.3;color:var(--muted);margin:0}
.ta-bign{justify-content:space-between}
.ta-bign>h2{font-family:var(--font-head);font-weight:900;font-size:56px;line-height:1;letter-spacing:-.025em;color:var(--fg);margin:0;max-width:1500px}
.ta-bign-t{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;margin-top:40px;align-items:baseline}
.ta-bign-t h3{font-family:var(--font-head);font-weight:700;font-size:40px;line-height:1.1;color:var(--fg);margin:0}
.ta-bign-t p{font-size:27px;line-height:1.35;color:var(--text);margin:0}

/* cover: two fields, one seam */
.ta-low{left:0;right:0;top:50%;bottom:0;background:var(--brand)}
.ta-cut{inset:0;margin:0;padding:0 72px;display:flex;align-items:center;padding-bottom:calc(var(--fs)*.6);z-index:1;
  font-family:var(--font-head);font-weight:900;font-size:var(--fs);line-height:.92;letter-spacing:-.03em;text-transform:uppercase;pointer-events:none}
.ta-cut span{display:block;max-width:100%;text-wrap:balance}
.ta-cut.a{color:var(--fg);clip-path:inset(0 0 50% 0)}
.ta-cut.b{color:#fff;clip-path:inset(50% 0 0 0)}
.ta-cover{justify-content:space-between;padding-bottom:72px;z-index:2}
.ta-top{display:flex;justify-content:space-between;gap:60px;font-size:28px;font-weight:500;color:var(--fg)}
.ta-bot{display:flex;justify-content:space-between;align-items:flex-end;gap:80px;color:#fff}
.ta-bot p{font-size:32px;line-height:1.3;margin:0;max-width:980px;color:#fff;text-wrap:balance}
.ta-bot div{flex:none;text-align:right;font-size:24px;line-height:1.35}
.ta-bot b{display:block;font-weight:700}

/* chapters */
.ta-chap{inset:0;background:var(--brand)}
.ta-chap.alt{background:var(--ink)}
.t-section .ta-sec{justify-content:space-between;--fg:#fff;--text:#fff;padding-bottom:72px}
.ta-giant{font-family:var(--font-head);font-weight:900;font-size:var(--fs);line-height:.9;letter-spacing:-.035em;text-transform:uppercase;color:var(--fg);margin:0 0 .14em;text-wrap:balance}
.ta-giant span{display:inline-block}
.ta-sec-sub{font-size:32px;line-height:1.3;color:#fff;margin:0 0 36px;max-width:1100px}

/* quote and statement */
.ta-quote{justify-content:space-between;padding-bottom:84px}
.ta-quote h2{font-family:var(--font-head);font-weight:900;font-size:var(--fs);line-height:1.02;letter-spacing:-.03em;color:var(--fg);margin:0;text-wrap:balance}
.ta-by{display:flex;gap:24px;align-items:baseline;font-size:28px;line-height:1.3;color:var(--fg)}
.ta-by b{font-weight:700}
.ta-state{justify-content:space-between;padding-bottom:84px}
.ta-state .ta-note{max-width:none;text-align:left;padding:0}
.ta-state .stmt{font-weight:900;font-size:var(--fs);line-height:1.02;letter-spacing:-.03em;color:var(--fg);margin:0;max-width:none;text-wrap:balance}
.ta-state .stmt em{color:inherit}

/* closing */
.ta-end{justify-content:space-between;padding-bottom:72px}
.ta-end-top{display:flex;justify-content:space-between;gap:80px;font-size:32px;line-height:1.3;color:var(--fg)}
.ta-end-top p{margin:0 0 8px;color:var(--fg)}
.ta-end-top ul{list-style:none;margin:0;padding:0;font-size:28px;text-align:right}
`
  };
});
