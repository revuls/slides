/* editor.js — visual deck editor. Loaded on demand by openEditor() in index.html; it shares the engine's globals (G, slideHTML, refreshSlide…).
   It edits G.source, the deck as it was loaded, so sanitized text never reaches the saved file. The form comes from editor/schema.js.
   Saving: through the API of scripts/serve.mjs for a same-origin data/*.json deck (autosave); otherwise to a file the user picks, or a download. */
(function () {
  const S = window.SLIDE_SCHEMA;
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || (v === false && k !== 'spellcheck')) return;
      if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach(c => { if (c != null && c !== false) n.append(c); });
    return n;
  };
  const icon = name => el('i', { class: name.startsWith('fill:') ? `ph-fill ph-${name.slice(5)}` : `ph ph-${name}`, 'aria-hidden': 'true' });
  const btn = (name, title, fn, o = {}) => el('button', { type: 'button', class: o.class || 've-ib', title, 'aria-label': title, disabled: o.disabled, onclick: fn }, icon(name), o.text);
  const clone = o => JSON.parse(JSON.stringify(o));
  const plain = v => String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); t = null; fn(...a); }; d.cancel = () => { clearTimeout(t); t = null; }; return d; };
  const typeOf = s => S.types[s?.type];

  const state = { open: false, tab: 'slide', raw: false, past: [], future: [], snapshot: '', coalesce: null, coalesceAt: 0, closed: new Set(), issues: [], source: null };
  const save = { mode: 'none', hash: '', dirty: false, busy: false, again: false, handle: null, backedUp: false, status: 'saved', animations: [] };
  const refs = {};
  let thumbObserver = null;

  /* ---------- deck edits ---------- */
  const slides = () => G.source.slides;
  const current = () => slides()[G.cur];
  // Every edit goes through here: history → preview → autosave
  function commit(scope = 'slide', key = null) {
    const snap = JSON.stringify(G.source);
    if (snap === state.snapshot) return;
    const now = Date.now();
    if (!(key && key === state.coalesce && now - state.coalesceAt < 1500)) { state.past.push(state.snapshot); if (state.past.length > 200) state.past.shift(); }
    state.coalesce = key; state.coalesceAt = now;
    state.future = []; state.snapshot = snap; G.json = snap;
    markDirty(); updateUndo();
    if (scope !== 'slide') rebuild(scope === 'style');
    else if (state.tab === 'deck') softRebuild();
    else livePreview();
  }
  const livePreview = debounce(() => {
    const i = G.cur; if (!G.source || !slides()[i]) return;
    G.deck.slides[i] = G.untrusted ? sanitizeDeck(slides()[i]) : slides()[i];
    const node = refreshSlide(i); if (node) node.classList.add('static');
    drawThumb(i); updateSlideNotice();
  }, 140);
  // Deck text (title, date…) appears on every slide: re-render them all but leave the form, which is being typed in, alone
  const softRebuild = debounce(() => {
    renderDeck(G.source, { untrusted: G.untrusted, animOK: G.animOK, share: G.share, slide: G.cur });
    markStatic(); buildRail(); updateCounter(); updateTitle();
  }, 400);
  const updateTitle = () => { refs.title.textContent = plain(G.source.meta?.title || slides()[0]?.title || fileName()); };
  // Whole deck re-render: after adding, removing or moving slides, and for deck settings
  function rebuild(newStyle = false, slide = G.cur) {
    livePreview.cancel(); softRebuild.cancel();
    const n = Math.max(0, Math.min(slide, slides().length - 1));
    const done = () => { markStatic(); buildRail(); buildPanel(); updateCounter(); updateTitle(); };
    const opts = { untrusted: G.untrusted, animOK: G.animOK, share: G.share, slide: n };
    if (newStyle) {
      const u = new URL(location.href);
      if (u.searchParams.has('style') || u.searchParams.has('theme')) { u.searchParams.delete('style'); u.searchParams.delete('theme'); history.replaceState(null, '', u); }   // the deck's own setting must win over the URL
      return buildPresentation(G.source, opts).then(done);
    }
    renderDeck(G.source, opts); done();
  }
  const markStatic = () => G.els.forEach(n => { n.classList.add('static'); settleCounters(n); });
  function goTo(i) {
    if (i < 0 || i >= slides().length || i === G.cur) return;
    livePreview.flush();
    go(i, true); G.els[i].classList.add('static');
    state.raw = false;
    $$('.ve-th', refs.rail).forEach((t, k) => t.classList.toggle('on', k === i));
    $$('.ve-th', refs.rail)[i]?.scrollIntoView({ block: 'nearest' });
    updateCounter(); buildPanel();
  }
  function restore(snap, pushTo) {
    pushTo.push(state.snapshot);
    const style = G.source.meta?.style;
    state.snapshot = snap; G.source = JSON.parse(snap); G.json = snap; state.source = G.source; state.coalesce = null;
    markDirty(); updateUndo();
    rebuild(style !== G.source.meta?.style);
  }
  const undo = () => { if (state.past.length) restore(state.past.pop(), state.future); };
  const redo = () => { if (state.future.length) restore(state.future.pop(), state.past); };

  /* slide operations */
  function addSlide(type) {
    const s = clone(S.types[type].sample), at = G.cur + 1;
    slides().splice(at, 0, s); G.cur = at; closeModal();
    commit('deck');
    setTimeout(() => { const first = $('input[type=text],textarea', refs.form); first?.focus(); first?.select(); }, 60);
  }
  function duplicateSlide(i = G.cur) { slides().splice(i + 1, 0, clone(slides()[i])); G.cur = i + 1; commit('deck'); }
  function deleteSlide(i = G.cur) {
    if (slides().length <= 1) return toast('La presentación necesita al menos un slide', true);
    slides().splice(i, 1); if (G.cur >= slides().length) G.cur = slides().length - 1; else if (i < G.cur) G.cur--;
    commit('deck'); toast('Slide eliminado · ⌘/Ctrl+Z para deshacer');
  }
  function moveSlide(from, to) {
    if (to < 0 || to >= slides().length || from === to) return;
    const [s] = slides().splice(from, 1); slides().splice(to, 0, s);
    G.cur = G.cur === from ? to : G.cur + (from < G.cur && to >= G.cur ? -1 : from > G.cur && to <= G.cur ? 1 : 0);
    commit('deck');
  }
  // Keeps what both types share: header, notes and the items of the main list
  function changeType(type) {
    const old = current(), T = S.types[type], next = clone(T.sample);
    const hasField = k => T.fields.some(f => f.k === k);
    ['notes', 'theme', 'chrome'].forEach(k => { if (old[k] != null) next[k] = old[k]; });
    ['kicker', 'title', 'subtitle', 'image', 'text'].forEach(k => { if (old[k] != null && hasField(k)) next[k] = old[k]; });
    if (old.title && !hasField('title') && hasField('text')) next.text = old.title;
    if (old.text && !old.title && hasField('title')) next.title = plain(old.text);
    const oldList = typeOf(old)?.fields.find(f => f.kind === 'list' && listKey(old, f)), newList = T.fields.find(f => f.kind === 'list');
    if (oldList && newList) {
      const items = old[listKey(old, oldList)].map(it => typeof it === 'string' ? { [oldList.str || 'title']: it } : it), keys = newList.fields.map(f => f.k), main = newList.fields.find(f => f.req && ['text', 'area'].includes(f.kind))?.k;
      next[newList.k] = items.slice(0, newList.max).map((it, n) => {
        const o = clone(next[newList.k]?.[n % (next[newList.k].length || 1)] || {});
        Object.keys(it).forEach(k => { if (keys.includes(k)) o[k] = it[k]; });
        const first = it.title ?? it.name ?? it.label ?? it.text ?? it.q; if (main && first != null && !Object.keys(it).includes(main)) o[main] = first;
        const body = it.text ?? it.desc; ['text', 'desc'].forEach(k => { if (keys.includes(k) && o[k] === undefined && body != null) o[k] = body; });
        return o;
      });
      while (next[newList.k].length < newList.min) next[newList.k].push(clone(T.sample[newList.k][next[newList.k].length % T.sample[newList.k].length]));
    }
    slides()[G.cur] = next; commit('deck');
  }

  /* ---------- form: values ---------- */
  const listKey = (o, f) => [f.k, ...(f.alias || [])].find(k => Array.isArray(o?.[k])) || null;
  const scalarKey = (o, f) => (f.alt && o[f.k] == null && o[f.alt] != null ? f.alt : f.k);
  // Empty optional values drop the key, so saved decks stay as clean as hand-written ones
  function setValue(o, f, v) {
    const k = scalarKey(o, f);
    if (v === undefined || v === '' || v === null || v === f.def) { if (f.req && v !== f.def) o[k] = ''; else delete o[k]; }
    else o[k] = v;
  }
  const change = (f, o, v, key) => { setValue(o, f, v); commit('slide', key); if (f.redraw) buildPanel(); };
  // Keeps numbers as numbers when a text box edits them (e.g. "number": 3)
  const keepType = (old, raw) => (typeof old === 'number' && raw.trim() !== '' && !isNaN(Number(raw.replace(',', '.'))) ? Number(raw.replace(',', '.')) : raw);
  const fieldId = { n: 0 };

  function wrap(f, control, o = {}) {
    const id = control.id || (control.id = 've-f' + ++fieldId.n);
    return el('div', { class: 've-field' + (o.cls ? ' ' + o.cls : '') },
      f.label && el('label', { htmlFor: id }, f.label, f.req && el('span', { class: 've-req', title: 'Obligatorio' }, ' *')),
      o.before, control, o.after, f.hint && el('small', {}, f.hint));
  }
  function strongShortcut(e) {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'b') return;
    const t = e.target, a = t.selectionStart, b = t.selectionEnd; if (a === b) return;
    e.preventDefault(); t.setRangeText(`<strong>${t.value.slice(a, b)}</strong>`, a, b, 'select'); t.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const autosize = t => { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 420) + 'px'; };

  const CONTROLS = {
    text(f, o, path) {
      const inp = el('input', { type: 'text', value: o[scalarKey(o, f)] ?? '', placeholder: f.ph, onkeydown: strongShortcut, oninput: e => change(f, o, keepType(o[scalarKey(o, f)], e.target.value), path) });
      return wrap(f, inp);
    },
    area(f, o, path) {
      const t = el('textarea', { rows: f.rows || 2, value: o[scalarKey(o, f)] ?? '', placeholder: f.ph, onkeydown: strongShortcut, oninput: e => { autosize(e.target); change(f, o, e.target.value, path); } });
      requestAnimationFrame(() => autosize(t));
      return wrap(f, t);
    },
    code(f, o, path) {
      const val = o[f.k], asLines = f.lines && (Array.isArray(val) || val == null);
      const t = el('textarea', { class: 've-mono', rows: f.rows || 8, spellcheck: false, value: Array.isArray(val) ? val.join('\n') : val ?? '', oninput: e => change(f, o, e.target.value === '' ? (f.req ? '' : undefined) : asLines ? e.target.value.split('\n') : e.target.value, path) });
      const node = wrap(f, t);
      if (!f.closed || val != null) return node;
      return el('details', { class: 've-group' }, el('summary', {}, f.label), node);
    },
    number(f, o, path) {
      const shift = f.base1 ? 1 : 0, cur = o[f.k];
      const inp = el('input', { type: 'number', step: 'any', min: f.min, max: f.max, value: cur == null || cur === '' ? '' : Number(String(cur).replace(',', '.')) + shift, placeholder: f.ph, oninput: e => { const raw = e.target.value; change(f, o, raw === '' ? (f.req ? 0 : undefined) : Number(raw) - shift, path); } });
      return wrap(f, inp);
    },
    bool(f, o) {
      const on = o[f.k] ?? f.def;
      return el('label', { class: 've-check' }, el('input', { type: 'checkbox', checked: !!on, onchange: e => change(f, o, e.target.checked) }), el('span', {}, f.label), f.hint && el('small', {}, f.hint));
    },
    select(f, o) {
      const opts = dynOptions(f), cur = o[f.k] ?? f.def ?? '', all = opts.some(x => String(x[0]) === String(cur)) ? opts : [...opts, [cur, String(cur)]];
      const sel = el('select', { onchange: e => { const v = all.find(x => String(x[0]) === e.target.value)?.[0]; setValue(o, f, v === '' ? undefined : v); commit(f.rebuild ? 'style' : 'slide'); if (f.redraw && !f.rebuild) buildPanel(); } }, all.map(([v, l]) => el('option', { value: String(v), selected: String(v) === String(cur) }, l)));
      return wrap(f, sel);
    },
    // Fixed options plus a free value (a custom word for the connector, a #hex colour…)
    combo(f, o, path) {
      const OTHER = '__other', cur = o[f.k], known = f.options.some(x => x[0] === (cur ?? ''));
      const free = el('input', { type: 'text', value: known ? '' : cur ?? '', placeholder: 'Escribe el valor', hidden: known, oninput: e => { setValue(o, f, e.target.value || undefined); commit('slide', path); } });
      const sel = el('select', { onchange: e => {
        const other = e.target.value === OTHER; free.hidden = !other;
        if (other) { free.focus(); return; }
        const v = f.options.find(x => String(x[0]) === e.target.value)?.[0]; setValue(o, f, v === '' ? undefined : v); commit('slide');
      } }, f.options.map(([v, l]) => el('option', { value: String(v), selected: known && v === (cur ?? '') }, l)), el('option', { value: OTHER, selected: !known }, 'Otro…'));
      return wrap(f, sel, { after: free });
    },
    icon(f, o, path) {
      const prev = el('i', { class: 've-iprev' });
      const paint = () => { const v = String(o[f.k] ?? ''); prev.className = 've-iprev ph ' + (v ? (v.startsWith('ph-') ? v : 'ph-' + v) : 'ph-circle-dashed'); };
      const inp = el('input', { type: 'text', value: o[f.k] ?? '', placeholder: 'ph-star', spellcheck: false, oninput: e => { change(f, o, e.target.value.trim(), path); paint(); } });
      const pick = el('button', { type: 'button', class: 've-swatch', title: 'Elegir icono', 'aria-label': 'Elegir icono', onclick: () => iconPicker(v => { inp.value = v; change(f, o, v, null); paint(); }) }, prev);
      paint();
      return wrap(f, inp, { before: pick, cls: 've-inline' });
    },
    image(f, o, path) {
      const prev = el('img', { alt: '', onerror: e => { e.target.hidden = true; } });
      const paint = () => { const v = o[f.k]; prev.hidden = !v; if (v) prev.src = v; };
      const inp = el('input', { type: 'text', value: o[f.k] ?? '', placeholder: 'https://… o assets/…', spellcheck: false, oninput: e => { change(f, o, e.target.value.trim(), path); paint(); } });
      const apply = v => { inp.value = v; change(f, o, v, null); paint(); };
      const upload = async file => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast('Ese archivo no es una imagen', true);
        box.classList.add('busy');
        try { apply(await uploadImage(file)); } catch (e) { toast('No se pudo subir: ' + e.message, true); }
        box.classList.remove('busy');
      };
      const file = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', hidden: true, onchange: e => { upload(e.target.files[0]); e.target.value = ''; } });
      const up = save.mode === 'server' && el('button', { type: 'button', class: 've-btn', onclick: () => file.click() }, icon('upload-simple'), 'Subir imagen');
      const box = el('div', { class: 've-img', ondragover: e => { e.preventDefault(); e.stopPropagation(); box.classList.add('over'); }, ondragleave: () => box.classList.remove('over'), ondrop: e => { e.preventDefault(); e.stopPropagation(); box.classList.remove('over'); if (save.mode === 'server') upload(e.dataTransfer.files[0]); else toast('Para subir imágenes, abre el deck con npm run serve', true); } }, prev, el('div', {}, inp, up, file));
      paint();
      inp.id = 've-f' + ++fieldId.n;
      return el('div', { class: 've-field' }, el('label', { htmlFor: inp.id }, f.label, f.req && el('span', { class: 've-req', title: 'Obligatorio' }, ' *')), box, f.hint && el('small', {}, f.hint));
    },
    anim(f, o, path) {
      const opts = save.animations, cur = o[f.k] ?? '';
      if (!opts.length) return wrap(f, el('input', { type: 'text', value: cur, placeholder: 'animations/…js', spellcheck: false, oninput: e => { change(f, o, e.target.value.trim(), path); } }));
      const all = opts.includes(cur) || !cur ? opts : [cur, ...opts];
      return wrap(f, el('select', { onchange: e => { change(f, o, e.target.value); } }, !cur && el('option', { value: '', selected: true }, 'Ninguna'), all.map(a => el('option', { value: a, selected: a === cur }, a.replace(/^animations\//, '').replace(/\.js$/, '')))));
    },
    nums(f, o, path) {
      const inp = el('input', { type: 'text', value: (o[f.k] || []).join(', '), placeholder: f.ph, oninput: e => { const v = e.target.value.split(/[\s,;]+/).map(Number).filter(n => Number.isInteger(n) && n > 0); change(f, o, v.length ? v : undefined, path); } });
      return wrap(f, inp);
    },
    json(f, o, path) {
      const msg = el('small', { class: 've-err', hidden: true });
      const t = el('textarea', { class: 've-mono', rows: 4, spellcheck: false, value: o[f.k] != null ? JSON.stringify(o[f.k], null, 2) : '', placeholder: '{ }', oninput: e => {
        const v = e.target.value.trim();
        try { const parsed = v ? JSON.parse(v) : undefined; if (parsed !== undefined && (typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error('Debe ser un objeto { … }'); msg.hidden = true; change(f, o, parsed, path); }
        catch (err) { msg.textContent = err.message; msg.hidden = false; }
      } });
      return wrap(f, t, { after: msg });
    },
    strings(f, o, path) { return stringList(f, o, path); },
    group(f, o, path) {
      const kid = o[f.k] && typeof o[f.k] === 'object' ? o[f.k] : {}, attach = () => { if (o[f.k] !== kid) o[f.k] = kid; };
      const prune = () => { if (!f.req && !Object.keys(kid).length) delete o[f.k]; };
      const proxy = new Proxy(kid, { set(t, k, v) { t[k] = v; attach(); return true; }, deleteProperty(t, k) { delete t[k]; prune(); return true; } });   // creates the object on the first value and removes it when emptied
      const key = path + '/' + f.k, open = !f.closed && (f.req || Object.keys(kid).length > 0 || !state.closed.has(key));
      return el('details', { class: 've-group', open, ontoggle: e => toggleClosed(key, !e.target.open) }, el('summary', {}, f.label), fieldsFor(f.fields, proxy, key));
    },
    list(f, o, path) { return listField(f, o, path); },
    table(f, o) { return tableField(o); },
    chart(f, o) { return chartField(o); }
  };
  const toggleClosed = (key, closed) => { closed ? state.closed.add(key) : state.closed.delete(key); };
  function dynOptions(f) {
    if (f.dyn === 'styles') return [['', 'Base'], ...(window.SLIDES_STYLES || []).map(x => [x.id, x.label])];
    if (f.dyn === 'themes') return [['', 'Por defecto'], ...Object.entries(THEMES).map(([k, t]) => [k, t.label])];
    return f.options;
  }
  function fieldsFor(fields, o, path) {
    const T = (G.types || TYPES)[current()?.type];        // engine definition: tells whether the type has particles
    return fields.filter(f => !f.when || f.when(o, T)).map(f => CONTROLS[f.kind](f, o, `${path}/${f.k}`));
  }

  /* ---------- form: lists ---------- */
  // Drag to reorder (slides in the rail, items in a list). The handle is what is draggable, so text fields keep normal selection.
  function sortable(root, itemSel, handleSel, onMove) {
    let from = -1;
    const items = () => $$(':scope > ' + itemSel, root);
    root.addEventListener('dragstart', e => {
      const h = e.target.closest?.(handleSel), it = h?.closest(itemSel); if (!it || it.parentElement !== root) return;
      e.stopPropagation(); from = items().indexOf(it); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(from));
      if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(it, 20, 20);
      it.classList.add('ve-dragging');
    });
    root.addEventListener('dragover', e => {
      if (from < 0) return; e.preventDefault(); e.stopPropagation();
      items().forEach(n => n.classList.remove('ve-before', 've-after'));
      const over = e.target.closest?.(itemSel); if (!over || over.parentElement !== root) return;
      const r = over.getBoundingClientRect();
      over.classList.add(e.clientY < r.top + r.height / 2 ? 've-before' : 've-after');
    });
    root.addEventListener('drop', e => {
      if (from < 0) return; e.preventDefault(); e.stopPropagation();
      const list = items(), over = e.target.closest?.(itemSel); let to = list.indexOf(over);
      if (to >= 0) { if (over.classList.contains('ve-after')) to++; if (from < to) to--; if (to !== from) onMove(from, to); }
      from = -1;
    });
    root.addEventListener('dragend', () => { from = -1; items().forEach(n => n.classList.remove('ve-before', 've-after', 've-dragging')); });
  }
  const arrMove = (a, from, to) => { const [x] = a.splice(from, 1); a.splice(to, 0, x); };
  const blankItem = (f, arr) => {
    const o = {}, label = f.item || 'Elemento';
    f.fields.forEach(x => {
      if (x.kind === 'list' || x.kind === 'group' || x.kind === 'bool' || x.kind === 'chart') return;
      if (x.req) o[x.k] = x.kind === 'number' ? 0 : x.kind === 'icon' ? 'ph-star' : x.kind === 'image' ? 'https://placehold.co/800x600?text=Imagen' : x.kind === 'select' ? x.options[0][0] : x.k === 'value' ? '0' : label;
    });
    if (!Object.keys(o).length) { const first = f.fields.find(x => x.kind === 'text' || x.kind === 'area'); if (first) o[first.k] = label; }
    const seed = arr[arr.length - 1];                    // a chart needs its grid; copy its shape from the previous one
    if (f.fields.some(x => x.kind === 'chart')) Object.assign(o, clone(seed && typeof seed === 'object' ? seed : { type: 'bar', labels: ['A', 'B'], datasets: [{ label: 'Serie', data: [1, 2] }] }));
    return o;
  };
  function listField(f, o, path) {
    const key = listKey(o, f) || f.k, arr = Array.isArray(o[key]) ? o[key] : [];
    const self = f.fields === 'self' ? { ...f, fields: orgFields() } : f;
    const redraw = () => { commit('slide'); buildPanel(); };
    const atMax = f.max != null && arr.length >= f.max, atMin = arr.length <= (f.min ?? 0);
    const items = el('div', { class: 've-items' }, arr.map((raw, n) => {
      const isStr = typeof raw === 'string';
      // A plain-string item is edited as an object and saved back as a string while it only has that one field
      const obj = isStr ? { [f.str]: raw } : raw;
      const sync = new Proxy(obj, { set(t, k, v) { t[k] = v; push(); return true; }, deleteProperty(t, k) { delete t[k]; push(); return true; } });
      function push() { const keys = Object.keys(obj); arr[n] = f.str && keys.length === 1 && keys[0] === f.str && isStr ? obj[f.str] : obj; }
      const summaryText = () => plain(obj.title ?? obj.name ?? obj.label ?? obj.text ?? obj.q ?? obj.value ?? obj.image ?? '') || `${f.item} ${n + 1}`;
      const label = el('span', { class: 've-sumtxt' }, summaryText());
      const itemKey = `${path}/${n}`, open = arr.length <= 4 ? !state.closed.has(itemKey) : state.closed.has('!' + itemKey);
      const body = el('div', { class: 've-itembody', oninput: () => { label.textContent = summaryText(); } }, fieldsFor(self.fields, sync, itemKey));
      return el('details', { class: 've-item', open, ontoggle: e => { if (arr.length <= 4) toggleClosed(itemKey, !e.target.open); else toggleClosed('!' + itemKey, e.target.open); } },
        el('summary', {},
          el('span', { class: 've-grip', draggable: true, title: 'Arrastra para ordenar' }, icon('dots-six-vertical')), label,
          el('span', { class: 've-tools', onclick: e => e.preventDefault() },
            btn('caret-up', 'Subir', () => { arrMove(arr, n, n - 1); redraw(); }, { disabled: n === 0 }),
            btn('caret-down', 'Bajar', () => { arrMove(arr, n, n + 1); redraw(); }, { disabled: n === arr.length - 1 }),
            btn('copy', 'Duplicar', () => { arr.splice(n + 1, 0, clone(raw)); redraw(); }, { disabled: atMax }),
            btn('trash', atMin ? `Mínimo ${f.min}` : 'Eliminar', () => { arr.splice(n, 1); if (!arr.length && !f.min) delete o[key]; redraw(); }, { disabled: atMin }))),
        body);
    }));
    sortable(items, '.ve-item', '.ve-grip', (from, to) => { arrMove(arr, from, to); redraw(); });
    const add = el('button', { type: 'button', class: 've-btn ve-add', disabled: atMax, title: atMax ? `Este tipo admite hasta ${f.max}` : '', onclick: () => {
      const it = blankItem(self, arr); if (!Array.isArray(o[key])) o[key] = arr; arr.push(it);
      commit('slide'); state.closed.add('!' + `${path}/${arr.length - 1}`); buildPanel();
    } }, icon('plus'), `Añadir ${(f.item || 'elemento').toLowerCase()}`);
    return el('div', { class: 've-list' }, el('div', { class: 've-listhd' }, el('b', {}, f.label), f.max != null && el('span', {}, `${arr.length} de ${f.max}`)), items, add);
  }
  const orgFields = () => S.types.org.fields.find(f => f.k === 'root').fields;

  function stringList(f, o, path) {
    const arr = Array.isArray(o[f.k]) ? o[f.k] : [];
    const redraw = () => { commit('slide'); buildPanel(); };
    const min = f.min ?? 0, atMax = f.max != null && arr.length >= f.max;
    const rows = el('div', { class: 've-strs' }, arr.map((v, n) => el('div', { class: 've-str' },
      el('span', { class: 've-grip', draggable: true, title: 'Arrastra para ordenar' }, icon('dots-six-vertical')),
      el('input', { type: 'text', value: v ?? '', 'aria-label': `${f.label} ${n + 1}`, onkeydown: e => {
        strongShortcut(e);
        if (e.key === 'Enter' && !atMax) { e.preventDefault(); arr.splice(n + 1, 0, ''); commit('slide'); buildPanel(); const inputs = $$(`[data-strs="${CSS.escape(path)}"] input`, refs.form); inputs[n + 1]?.focus(); }
      }, oninput: e => { arr[n] = e.target.value; commit('slide', `${path}/${n}`); } }),
      btn('x', arr.length <= min ? `Mínimo ${min}` : 'Quitar', () => { arr.splice(n, 1); if (!arr.length && !min) delete o[f.k]; redraw(); }, { disabled: arr.length <= min }))));
    sortable(rows, '.ve-str', '.ve-grip', (from, to) => { arrMove(arr, from, to); redraw(); });
    const add = el('button', { type: 'button', class: 've-btn ve-add', disabled: atMax, onclick: () => { if (!Array.isArray(o[f.k])) o[f.k] = arr; arr.push(''); commit('slide'); buildPanel(); const inputs = $$(`[data-strs="${CSS.escape(path)}"] input`, refs.form); inputs[inputs.length - 1]?.focus(); } }, icon('plus'), 'Añadir');
    return el('div', { class: 've-list', 'data-strs': path }, el('div', { class: 've-listhd' }, el('b', {}, f.label), f.max != null && el('span', {}, `${arr.length} de ${f.max}`)), f.hint && el('small', {}, f.hint), rows, add);
  }

  /* ---------- form: tables and chart data ---------- */
  function gridButton(name, title, fn, disabled) { return btn(name, title, fn, { disabled, class: 've-ib sm' }); }
  function tableField(o) {
    if (!Array.isArray(o.headers)) o.headers = [];
    if (!Array.isArray(o.rows)) o.rows = [];
    const redraw = () => { commit('slide'); buildPanel(); };
    const cols = o.headers.length;
    const cell = (v, set, label) => el('input', { type: 'text', value: v ?? '', 'aria-label': label, oninput: e => { set(keepType(v, e.target.value)); commit('slide', label); } });
    const head = el('tr', {}, o.headers.map((h, c) => el('th', {},
      cell(h, v => { o.headers[c] = v; }, `Cabecera ${c + 1}`),
      el('div', { class: 've-coltools' },
        gridButton(o.highlight === c ? 'fill:star' : 'star', o.highlight === c ? 'Quitar resaltado' : 'Resaltar columna', () => { if (o.highlight === c) delete o.highlight; else o.highlight = c; redraw(); }),
        gridButton('x', 'Quitar columna', () => { o.headers.splice(c, 1); o.rows.forEach(r => r.splice(c, 1)); if (o.highlight === c) delete o.highlight; else if (o.highlight > c) o.highlight--; redraw(); }, cols <= 2)))), el('th', {}));
    const body = o.rows.map((r, n) => el('tr', {}, o.headers.map((_, c) => el('td', {}, cell(r[c], v => { r[c] = v; }, `Fila ${n + 1}, columna ${c + 1}`))), el('td', { class: 've-rowtools' },
      gridButton('caret-up', 'Subir fila', () => { arrMove(o.rows, n, n - 1); redraw(); }, n === 0),
      gridButton('x', 'Quitar fila', () => { o.rows.splice(n, 1); redraw(); }, o.rows.length <= 1))));
    return el('div', { class: 've-list' }, el('div', { class: 've-listhd' }, el('b', {}, 'Tabla'), el('span', {}, `${o.rows.length} filas · máx. 8 recomendado`)),
      el('div', { class: 've-gridwrap' }, el('table', { class: 've-grid' }, el('thead', {}, head), el('tbody', {}, body))),
      el('div', { class: 've-row' },
        el('button', { type: 'button', class: 've-btn', onclick: () => { o.rows.push(o.headers.map(() => '')); redraw(); } }, icon('plus'), 'Fila'),
        el('button', { type: 'button', class: 've-btn', onclick: () => { o.headers.push(`Columna ${cols + 1}`); o.rows.forEach(r => r.push('')); redraw(); } }, icon('plus'), 'Columna')));
  }
  function chartField(c) {
    if (!Array.isArray(c.labels)) c.labels = [];
    const flat = ['doughnut', 'pie'].includes(c.type);
    const redraw = () => { commit('slide'); buildPanel(); };
    const sets = () => c.datasets ?? (c.datasets === undefined && c.data ? [c] : []);
    const series = sets();
    if (!series.length) { c.datasets = [{ label: 'Serie', data: c.labels.map(() => 0) }]; series.push(c.datasets[0]); }
    const shown = flat ? series.slice(0, 1) : series;
    const parse = raw => { const n = Number(String(raw).replace(',', '.')); return raw === '' || isNaN(n) ? null : n; };
    const lab = (v, set, label) => el('input', { type: 'text', value: v ?? '', 'aria-label': label, oninput: e => { set(e.target.value); commit('slide', label); } });
    const head = el('tr', {}, el('th', {}, 'Etiqueta'), shown.map((d, j) => el('th', {},
      flat ? 'Valor' : d === c ? 'Valor' : lab(d.label, v => { d.label = v; }, `Serie ${j + 1}`),
      !flat && d !== c && el('div', { class: 've-coltools' },
        el('select', { class: 've-mini', title: 'Color de la serie', 'aria-label': 'Color de la serie', onchange: e => { if (e.target.value) d.color = e.target.value; else delete d.color; commit('slide'); } }, [['', 'Auto'], ['orange', 'Marca'], ['navy', 'Oscuro'], ['blue', 'Secund.'], ['amber', 'Claro'], ['sky', 'Suave'], ['gray', 'Gris']].concat(d.color && !['orange', 'navy', 'blue', 'amber', 'sky', 'gray'].includes(d.color) ? [[d.color, d.color]] : []).map(([v, l]) => el('option', { value: v, selected: (d.color ?? '') === v }, l))),
        gridButton('x', 'Quitar serie', () => { c.datasets.splice(j, 1); redraw(); }, shown.length <= 1)))), el('th', {}));
    const body = c.labels.map((l, n) => el('tr', {}, el('td', {}, lab(l, v => { c.labels[n] = v; }, `Etiqueta ${n + 1}`)),
      shown.map((d, j) => el('td', {}, el('input', { type: 'number', step: 'any', value: d.data?.[n] ?? '', 'aria-label': `Valor ${n + 1}, serie ${j + 1}`, oninput: e => { d.data[n] = parse(e.target.value); commit('slide', `d${j}/${n}`); } }))),
      el('td', { class: 've-rowtools' }, gridButton('x', 'Quitar fila', () => { c.labels.splice(n, 1); series.forEach(d => d.data?.splice(n, 1)); redraw(); }, c.labels.length <= 1))));
    return el('div', { class: 've-list' }, el('div', { class: 've-listhd' }, el('b', {}, 'Datos')),
      el('div', { class: 've-gridwrap' }, el('table', { class: 've-grid' }, el('thead', {}, head), el('tbody', {}, body))),
      el('div', { class: 've-row' },
        el('button', { type: 'button', class: 've-btn', onclick: () => { c.labels.push(`Dato ${c.labels.length + 1}`); series.forEach(d => { (d.data = d.data || []).push(0); }); redraw(); } }, icon('plus'), 'Fila'),
        !flat && el('button', { type: 'button', class: 've-btn', onclick: () => {
          if (!c.datasets) { c.datasets = [{ label: c.title || 'Serie 1', data: c.data || [] }]; delete c.data; }
          c.datasets.push({ label: `Serie ${c.datasets.length + 1}`, data: c.labels.map(() => 0) }); redraw();
        } }, icon('plus'), 'Serie')));
  }

  /* ---------- panels ---------- */
  function buildPanel() {
    if (!state.open) return;
    const scroll = refs.form.scrollTop;
    refs.form.replaceChildren(state.tab === 'deck' ? deckForm() : state.raw ? rawForm() : slideForm());
    refs.form.scrollTop = scroll;
    $$('.ve-tab', refs.panel).forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
    updateSlideNotice();
  }
  function slideForm() {
    const s = current(), T = typeOf(s), frag = document.createDocumentFragment();
    T?.migrate?.(s);
    const types = Object.entries(S.types), groups = [...new Set(types.map(([, t]) => t.group))];
    frag.append(el('div', { class: 've-field' }, el('label', { htmlFor: 've-type' }, 'Tipo de slide'),
      el('select', { id: 've-type', onchange: e => changeType(e.target.value) },
        !T && el('option', { selected: true, value: s.type }, s.type),
        groups.map(g => el('optgroup', { label: g }, types.filter(([, t]) => t.group === g).map(([k, t]) => el('option', { value: k, selected: k === s.type }, t.label)))))));
    frag.append(refs.notice = el('div', { class: 've-notice', hidden: true }));
    if (T) frag.append(...fieldsFor(T.fields, s, ''));
    else frag.append(el('p', { class: 've-empty' }, `El tipo «${s.type}» no tiene formulario. Edítalo como JSON.`));
    frag.append(CONTROLS.area({ k: 'notes', label: 'Notas del orador', rows: 3 }, s, '/notes'));
    frag.append(el('details', { class: 've-group', ontoggle: e => toggleClosed('!look', e.target.open), open: state.closed.has('!look') }, el('summary', {}, 'Aspecto'), fieldsFor(S.common, s, '')));
    frag.append(el('button', { type: 'button', class: 've-btn ve-rawbtn', onclick: () => { state.raw = true; buildPanel(); } }, icon('brackets-curly'), 'Ver como JSON'));
    return frag;
  }
  function rawForm() {
    const msg = el('small', { class: 've-err', hidden: true });
    const t = el('textarea', { class: 've-mono ve-raw', spellcheck: false, value: JSON.stringify(current(), null, 2), oninput: e => {
      try {
        const v = JSON.parse(e.target.value);
        if (!v || typeof v !== 'object' || Array.isArray(v) || !v.type) throw new Error('El slide debe ser un objeto con "type"');
        msg.hidden = true; slides()[G.cur] = v; commit('slide', 'raw');
      } catch (err) { msg.textContent = err.message; msg.hidden = false; }
    } });
    return el('div', { class: 've-rawbox' }, el('button', { type: 'button', class: 've-btn', onclick: () => { state.raw = false; buildPanel(); } }, icon('arrow-left'), 'Volver al formulario'), t, msg);
  }
  function deckForm() {
    if (!G.source.meta) G.source.meta = {};
    const m = G.source.meta;
    const form = el('div', { class: 've-deckform' }, S.meta.map(f => CONTROLS[f.kind](f, m, `/meta/${f.k}`)));
    return el('div', {}, el('p', { class: 've-lead' }, 'Estos ajustes se aplican a toda la presentación.'), form, deckStats());
  }
  function deckStats() {
    const n = slides().length, an = slides().filter(s => s.type === 'animation').length;
    return el('p', { class: 've-stats' }, `${n} slides${an ? ` · ${an} animaciones` : ''}`);
  }
  function updateSlideNotice() {
    if (!refs.notice?.isConnected) return;
    const here = state.issues.filter(x => x.slide === G.cur + 1), zoom = $$('.body > *', G.els[G.cur]).map(c => c.style.zoom).find(Boolean);
    const lines = here.map(x => el('div', { class: x.severity }, icon(x.severity === 'error' ? 'warning-octagon' : 'warning'), x.message));
    if (zoom) lines.unshift(el('div', { class: 'warning' }, icon('warning'), 'El contenido no cabe y se ha reducido: acorta el texto o divide el slide.'));
    refs.notice.replaceChildren(...lines); refs.notice.hidden = !lines.length;
  }
  function updateCounter() { refs.counter.textContent = `Slide ${G.cur + 1} de ${slides().length}`; refs.moveUp.disabled = G.cur === 0; refs.moveDown.disabled = G.cur === slides().length - 1; refs.del.disabled = slides().length <= 1; }
  function updateUndo() { refs.undo.disabled = !state.past.length; refs.redo.disabled = !state.future.length; }

  /* ---------- thumbnails ---------- */
  const thumbLabel = (s, i) => `${i + 1}. ${plain(s.title || s.text || s.value || typeOf(s)?.label || s.type).replace(/\*/g, '').slice(0, 60)}`;
  function killThumb(tv) {
    (tv._charts || []).forEach(c => c.destroy()); tv._charts = null;
    tv._anim?.release(); tv._anim = null;
    tv.replaceChildren();
  }
  // Paints a slide in a box. The rail passes the deck index (charts read their data from the deck); the type picker passes the sample itself.
  function paintThumb(tv, s, i, standalone) {
    killThumb(tv);
    tv.innerHTML = slideHTML(s, i, true);
    const slide = tv.firstElementChild; if (!slide) return;
    fitSlide(slide);
    if ($('.an-cv', slide)) { tv._anim = new Anim(slide, s, i); tv._anim.start({ static: true, thumb: true }); }
    if (standalone) { tv._charts = $$('canvas[data-ci]', slide).map((cv, j) => s.charts?.[j] && makeChart(cv, s.charts[j], slide.classList.contains('dark'), false, 1)).filter(Boolean); }
    else tv._charts = mountCharts(tv, false, 1);
  }
  const drawThumb = debounce(i => { const th = $$('.ve-th', refs.rail)[i]; if (!th) return; const tv = $('.ve-tv', th); tv.dataset.done = '1'; paintThumb(tv, G.deck.slides[i], i); $('.ve-thlab', th).textContent = thumbLabel(slides()[i], i); }, 300);
  function lazyThumbs(root) {
    thumbObserver?.disconnect();
    thumbObserver = new IntersectionObserver(entries => entries.forEach(e => {
      const tv = e.target; if (!e.isIntersecting || tv.dataset.done) return;
      tv.dataset.done = '1'; tv._paint();
    }), { root, rootMargin: '400px' });
  }
  function buildRail() {
    $$('.ve-tv', refs.rail).forEach(killThumb);
    lazyThumbs(refs.railList);
    refs.railList.replaceChildren(...slides().map((s, i) => {
      const tv = el('div', { class: 've-tv' }); tv._paint = () => paintThumb(tv, G.deck.slides[i], i);
      thumbObserver.observe(tv);
      return el('div', { class: 've-th' + (i === G.cur ? ' on' : ''), role: 'button', tabIndex: 0, 'aria-label': thumbLabel(s, i), onclick: () => goTo(i), onkeydown: e => { if (e.key === 'Enter') goTo(i); } },
        el('div', { class: 've-thbox', draggable: true }, tv, el('span', { class: 've-no' }, i + 1)), el('span', { class: 've-thlab' }, thumbLabel(s, i)));
    }));
    setTimeout(() => $('.ve-th.on', refs.railList)?.scrollIntoView({ block: 'nearest' }), 30);
  }

  /* ---------- modals ---------- */
  function modal(title, body, cls = '') {
    closeModal();
    refs.modal = el('div', { class: 've-modal ' + cls, onclick: e => { if (e.target === refs.modal) closeModal(); } },
      el('div', { class: 've-box', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, el('header', {}, el('h3', {}, title), btn('x', 'Cerrar', closeModal)), body));
    refs.root.append(refs.modal);
  }
  function closeModal() { if (!refs.modal) return false; $$('.ve-tv', refs.modal).forEach(killThumb); refs.modal.remove(); refs.modal = null; return true; }
  function typePicker() {
    const types = Object.entries(S.types), groups = [...new Set(types.map(([, t]) => t.group))];
    const body = el('div', { class: 've-pick' }, groups.map(g => el('section', {}, el('h4', {}, g), el('div', { class: 've-pickgrid' }, types.filter(([, t]) => t.group === g).map(([k, t]) => {
      const tv = el('div', { class: 've-tv' }); tv._paint = () => paintThumb(tv, { ...clone(t.sample), ...(k === 'section' ? { number: '01' } : {}) }, G.deck.slides.length, true);
      return el('button', { type: 'button', class: 've-pickitem', onclick: () => addSlide(k) }, tv, el('span', {}, icon(t.icon), t.label));
    })))));
    modal('Añadir slide', body, 've-wide');
    const obs = new IntersectionObserver(es => es.forEach(e => { const tv = e.target; if (e.isIntersecting && !tv.dataset.done) { tv.dataset.done = '1'; tv._paint(); } }), { root: body, rootMargin: '200px' });
    $$('.ve-tv', body).forEach(t => obs.observe(t));
  }
  function iconPicker(pick) {
    const grid = el('div', { class: 've-icons' });
    const paint = q => grid.replaceChildren(...S.ICONS.filter(n => n.includes(q)).map(n => el('button', { type: 'button', title: n, 'aria-label': n, onclick: () => { pick('ph-' + n); closeModal(); } }, icon(n))));
    const search = el('input', { type: 'search', placeholder: 'Buscar (en inglés): star, chart…', oninput: e => paint(e.target.value.trim().toLowerCase()) });
    paint('');
    modal('Elegir icono', el('div', {}, search, grid, el('p', { class: 've-lead' }, 'Hay miles más en ', el('a', { href: 'https://phosphoricons.com', target: '_blank', rel: 'noopener' }, 'phosphoricons.com'), ': escribe su nombre en el campo.')));
    search.focus();
  }

  /* ---------- saving ---------- */
  const serialized = () => JSON.stringify(G.source, null, 2) + '\n';
  const fileName = () => (G.srcPath || 'presentacion.json').split('/').pop();
  const deckSlug = () => fileName().replace(/\.json$/, '');
  function setStatus(status, msg) {
    save.status = status;
    const LABEL = { saved: ['check-circle', 'Guardado'], saving: ['circle-notch', 'Guardando…'], dirty: ['pencil-simple', save.mode === 'server' || save.handle ? 'Guardando…' : 'Sin guardar'], error: ['warning', 'No guardado'], conflict: ['warning', 'Conflicto'] }[status];
    refs.status.className = 've-status ' + status; refs.status.replaceChildren(icon(LABEL[0]), msg || LABEL[1]);
    refs.saveBtn.hidden = !(status === 'error' || status === 'conflict' || (status === 'dirty' && save.mode !== 'server' && !save.handle));
    refs.saveBtn.lastChild.textContent = save.mode === 'server' ? 'Reintentar' : save.mode === 'file' ? 'Guardar…' : 'Descargar';
  }
  function markDirty() { save.dirty = true; setStatus('dirty'); if (save.mode === 'server' || save.handle) autosave(); }
  const autosave = debounce(() => saveNow(), 900);
  async function saveNow(opts = {}) {
    if (!save.dirty && !opts.force) return;
    if (save.busy) { save.again = true; return; }
    if (save.mode === 'server') return saveServer(opts);
    if (save.mode === 'file') return saveFile();
    return saveDownload();
  }
  async function saveServer({ force } = {}) {
    save.busy = true; setStatus('saving');
    const sent = state.snapshot;
    try {
      const q = new URLSearchParams({ path: G.srcPath }); if (!force) q.set('base', save.hash); if (!save.backedUp) q.set('backup', '1');
      const r = await fetch('api/deck?' + q, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: serialized() });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { save.busy = false; save.again = false; return conflict(); }
      if (!r.ok) throw new Error(j.error || r.status);
      save.hash = j.hash; save.backedUp = true; state.issues = j.issues || [];
      if (sent === state.snapshot) { save.dirty = false; setStatus('saved'); }
      updateSlideNotice();
    } catch (e) { console.error(e); setStatus('error'); toast('No se pudo guardar: ' + e.message, true); }
    save.busy = false;
    if (save.again || (save.dirty && save.status !== 'error')) { save.again = false; if (save.dirty) autosave(); }
  }
  function conflict() {
    setStatus('conflict');
    modal('El archivo ha cambiado', el('div', {},
      el('p', { class: 've-lead' }, `Alguien más ha modificado ${fileName()} mientras editabas (otra pestaña, un editor de texto o un agente).`),
      el('div', { class: 've-row' },
        el('button', { type: 'button', class: 've-btn primary', onclick: () => { closeModal(); saveNow({ force: true }); } }, icon('floppy-disk'), 'Guardar mi versión encima'),
        el('button', { type: 'button', class: 've-btn', onclick: () => { save.dirty = false; location.reload(); } }, icon('arrow-clockwise'), 'Descartar y cargar la del archivo'))));
  }
  async function saveFile() {
    try {
      if (!save.handle) save.handle = await window.showSaveFilePicker({ suggestedName: fileName(), types: [{ description: 'Presentación JSON', accept: { 'application/json': ['.json'] } }] });
      save.busy = true; setStatus('saving');
      const sent = state.snapshot, w = await save.handle.createWritable();
      await w.write(serialized()); await w.close();
      if (sent === state.snapshot) { save.dirty = false; setStatus('saved', `Guardado en ${save.handle.name}`); }
    } catch (e) {
      if (e.name !== 'AbortError') { console.error(e); save.handle = null; toast('No se pudo guardar: ' + e.message, true); setStatus('error'); }
    }
    save.busy = false;
    if (save.again) { save.again = false; autosave(); }
  }
  function saveDownload() {
    const url = URL.createObjectURL(new Blob([serialized()], { type: 'application/json' }));
    el('a', { href: url, download: fileName() }).click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    save.dirty = false; setStatus('saved', 'Descargado');
    toast(`Descargado ${fileName()}: sustituye con él tu archivo original`);
  }
  async function uploadImage(file) {
    const q = new URLSearchParams({ deck: deckSlug(), name: file.name });
    const r = await fetch('api/asset?' + q, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || r.status);
    return j.path;
  }
  // Where edits go: decided every time a different deck enters the editor
  async function connectSave() {
    save.mode = window.showSaveFilePicker ? 'file' : 'download'; save.handle = null; save.backedUp = false; save.animations = []; state.issues = [];
    if (!G.srcPath || G.untrusted || !/^data\/[^/]+\.json$/.test(G.srcPath)) return;
    try {
      const r = await fetch('api/deck?path=' + encodeURIComponent(G.srcPath)); if (!r.ok) return;
      const j = await r.json();
      save.mode = 'server'; save.hash = j.hash; save.animations = j.animations || []; state.issues = j.issues || [];
      if (JSON.stringify(j.deck) !== G.json) { G.source = j.deck; G.json = JSON.stringify(j.deck); toast('Cargada la última versión del archivo'); return 'reloaded'; }
    } catch (e) { /* no editor API here (static hosting, file://): fall back to file or download */ }
  }

  /* ---------- click on the preview → jump to that field ---------- */
  function locate(e) {
    if (!state.open || e.target.closest('button,a,video,iframe,.cmp')) return;
    e.preventDefault();
    if (state.raw || state.tab !== 'slide') { state.raw = false; state.tab = 'slide'; buildPanel(); }
    for (let n = e.target; n && n !== G.els[G.cur]; n = n.parentElement) {
      const txt = plain(n.textContent); if (!txt || txt.length > 400) continue;
      const hit = $$('input[type=text],textarea', refs.form).find(i => plain(i.value) === txt) || $$('input[type=text],textarea', refs.form).find(i => plain(i.value).replace(/\*/g, '') === txt);
      if (!hit) continue;
      for (let d = hit.closest('details'); d; d = d.parentElement.closest('details')) d.open = true;
      hit.scrollIntoView({ block: 'center', behavior: 'smooth' }); hit.focus(); hit.select?.();
      const f = hit.closest('.ve-field,.ve-str,td,th'); f?.classList.add('ve-flash'); setTimeout(() => f?.classList.remove('ve-flash'), 1100);
      return;
    }
  }

  /* ---------- shortcuts ---------- */
  function onKey(e) {
    if (!state.open) return;
    const mod = e.metaKey || e.ctrlKey, inField = e.target.closest?.('input,textarea,select'), key = e.key.toLowerCase();
    if (mod && key === 's') { e.preventDefault(); autosave.cancel(); saveNow(); return; }
    if (mod && key === 'z' && !inField) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && key === 'y' && !inField) { e.preventDefault(); redo(); return; }
    if (mod && key === 'd') { e.preventDefault(); duplicateSlide(); return; }
    if (e.key === 'Escape') { if (closeModal()) return; if (inField) { e.target.blur(); return; } close(); return; }
    if (inField || refs.modal || mod) return;
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveSlide(G.cur, G.cur - 1); return; }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveSlide(G.cur, G.cur + 1); return; }
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); goTo(G.cur + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(G.cur - 1); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSlide(); }
    else if (key === 'n') { e.preventDefault(); typePicker(); }
  }

  /* ---------- open / close ---------- */
  function buildShell() {
    refs.status = el('span', { class: 've-status saved', role: 'status' });
    refs.saveBtn = el('button', { type: 'button', class: 've-btn primary', hidden: true, onclick: () => { autosave.cancel(); saveNow(); } }, icon('floppy-disk'), 'Guardar');
    refs.undo = btn('arrow-counter-clockwise', 'Deshacer (⌘/Ctrl+Z)', undo);
    refs.redo = btn('arrow-clockwise', 'Rehacer (⇧⌘/Ctrl+Z)', redo);
    refs.counter = el('span', { class: 've-count' });
    refs.title = el('b', { class: 've-title' });
    const bar = el('header', { class: 've-bar' },
      el('button', { type: 'button', class: 've-btn', onclick: close, title: 'Salir del editor (Esc)' }, icon('play'), 'Presentar'),
      refs.title, refs.counter, el('i', { class: 've-sp' }),
      refs.status, refs.saveBtn, refs.undo, refs.redo,
      btn('download-simple', 'Descargar una copia del JSON', () => { const dirty = save.dirty, status = save.status; saveDownload(); save.dirty = dirty; setStatus(status); }));
    refs.moveUp = btn('caret-up', 'Subir slide (Alt+↑)', () => moveSlide(G.cur, G.cur - 1));
    refs.moveDown = btn('caret-down', 'Bajar slide (Alt+↓)', () => moveSlide(G.cur, G.cur + 1));
    refs.del = btn('trash', 'Eliminar slide (Supr)', () => deleteSlide());
    refs.railList = el('div', { class: 've-thumbs' });
    sortable(refs.railList, '.ve-th', '.ve-thbox', (from, to) => moveSlide(from, to));
    refs.rail = el('aside', { class: 've-rail', 'aria-label': 'Slides' },
      el('button', { type: 'button', class: 've-btn primary ve-new', onclick: typePicker, title: 'Añadir slide (N)' }, icon('plus'), 'Añadir slide'),
      refs.railList,
      el('div', { class: 've-railtools' }, refs.moveUp, refs.moveDown, btn('copy', 'Duplicar slide (⌘/Ctrl+D)', () => duplicateSlide()), refs.del));
    refs.form = el('div', { id: 've-form', class: 've-form' });
    const tab = (id, label) => el('button', { type: 'button', class: 've-tab', 'data-tab': id, onclick: () => { state.tab = id; state.raw = false; buildPanel(); } }, label);
    refs.panel = el('aside', { class: 've-panel', 'aria-label': 'Propiedades' }, el('nav', { class: 've-tabs' }, tab('slide', 'Este slide'), tab('deck', 'Presentación')), refs.form);
    refs.root = el('div', { id: 've' }, bar, refs.rail, refs.panel);
    document.body.append(refs.root);
    document.addEventListener('keydown', onKey);
    stage.addEventListener('click', locate);
    addEventListener('beforeunload', e => { if (save.dirty) { e.preventDefault(); e.returnValue = ''; } });
  }
  async function open() {
    if (state.open || !G.source) return;
    if (!refs.root) buildShell();
    if (state.source !== G.source) {
      state.past = []; state.future = []; state.closed.clear(); state.tab = 'slide'; state.raw = false; save.dirty = false;
      if (await connectSave() === 'reloaded') await buildPresentation(G.source, { slide: Math.max(0, G.cur) });
      state.source = G.source; state.snapshot = JSON.stringify(G.source);
    }
    state.open = true;
    document.body.classList.add('editing');
    updateTitle();
    fit(); markStatic(); resetCharts(false);
    buildRail(); buildPanel(); updateCounter(); updateUndo();
    setStatus(save.dirty ? 'dirty' : 'saved', !save.dirty && save.mode !== 'server' ? 'Sin cambios' : undefined);
    if (save.mode !== 'server' && !hintShown()) toast(G.untrusted ? 'Este deck no viene de data/: al terminar, guárdalo en un archivo' : 'Sin servidor de edición: abre con npm run serve para guardar automáticamente');
  }
  function hintShown() { try { if (sessionStorage.getItem('ve-hint')) return true; sessionStorage.setItem('ve-hint', '1'); } catch (e) { /* storage unavailable */ } return false; }
  function close() {
    closeModal();
    livePreview.flush(); drawThumb.cancel();
    if (state.tab === 'deck') softRebuild.flush();
    if (save.dirty && (save.mode === 'server' || save.handle)) { autosave.cancel(); saveNow(); }
    else if (save.dirty) toast('Hay cambios sin guardar: guárdalos antes de cerrar la pestaña', true);
    state.open = false;
    document.body.classList.remove('editing');
    thumbObserver?.disconnect();
    $$('.ve-tv', refs.rail).forEach(killThumb);
    G.els.forEach(n => n.classList.remove('static'));
    fit(); resetCharts(false);
  }

  window.Editor = { open, close, unsaved: () => save.dirty };
})();
