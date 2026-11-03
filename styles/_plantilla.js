/* Style template. Copy it to styles/<id>.js (lowercase letters, digits and dashes), then run `npm run sync` so it shows
   up in the app's picker (S key). Use it with "meta": { "style": "<id>" } in a deck, or ?style=<id> in the URL.
   Everything below is optional except `label`: delete what you do not change. The full guide is the create-style skill. */
registerStyle(function (api) {
  // Helpers from the engine: ic(name, weight), words(title), stmtWords(text), hd(slide), cell(html, anim), rt(text),
  // pad(n), strip(html), ramp(i, n), numOf(value), initials(name), rings(i), hl(codeLine), tone(color), FB(label)
  // api.base.types / header / chrome / decor are the engine's own versions, to wrap or reuse them.
  const { rt, pad, words } = api;

  return {
    label: 'My style',                          // name in the style picker
    description: 'what it looks like and when to use it',   // shown to the AI in the chat prompts

    theme: 'my-palette',                        // default palette (meta.theme and ?theme= still win)
    // mode: 'dark',                            // default mode of light slides (meta.mode still wins)
    transition: 'fade',                         // slide | fade | zoom (meta.transition still wins)
    fonts: ['Inter:wght@400;700'],              // Google Fonts families (the part after "family=")
    // safe: { bottom: 985, right: 1815 },      // limits for Slides.audit() if your layout uses other margins

    // Palettes that only exist with this style. Add every token listed in the theming skill.
    themes: {
      'my-palette': { label: 'Mine', a: '#0B6E4F', b: '#10201A', vars: {
        '--brand': '#0B6E4F', '--brand-t': '#4FC79E', '--brand-l': '#2F9E78', '--brand-xl': '#B8E6D3', '--brand-d': '#07513A', '--brand-rgb': '11,110,79',
        '--ink': '#10201A', '--ink-rgb': '16,32,26', '--sec': '#8A5A12', '--tint-warm': '#F1F7F3', '--tint-blue': '#E8F0EC' } }
    },

    // Header of every slide type that uses hd(). Keep the title in an element with data-a.
    header: s => `<header class="hd">
      <h2 data-a="up">${s.title ?? ''}</h2>
      ${s.subtitle ? `<p class="sub" data-a="up">${rt(s.subtitle)}</p>` : ''}
    </header>`,

    // Content of .chrome (page number, footer, logo). c = { i, total, meta, sec, static, nofoot, logo, deckTitle }
    chrome: (s, c) => (c.nofoot ? '' : `<div class="my-pg">${pad(c.i + 1)} / ${pad(c.total)}</div>`),

    // Background elements behind the content. '' removes the engine's glows.
    decor: () => '',

    // Slide types. Same name as a built-in type = replaces it (the other properties are inherited, so
    // { theme: 'light' } alone only changes its default mode). New name = a type only this style has.
    types: {
      section: { render: (s, c) => `<div class="inner mid my-section">
        <span class="my-num" data-a="fade">${s.number ?? pad(c.sec)}</span>
        <h2 class="mega">${words(s.title)}</h2>
      </div>` }
      // 'my-type': { rules: { req: ['title'] }, render: (s, c) => `<div class="inner">${api.hd(s)}<div class="body">…</div></div>` }
    },

    // Loaded only while this style is active, after the engine's CSS, so it can override any engine class.
    css: `
:root{--font-head:'Inter',sans-serif;--font-body:'Inter',sans-serif}
.slide{background:var(--tint-warm)}
.slide.dark{background:var(--ink)}
.slide.orange{background:var(--brand)}
.my-pg{right:72px;bottom:42px;font-size:20px;color:var(--muted)}
.my-num{font-size:200px;font-weight:700;color:var(--accent)}
`
  };
});
