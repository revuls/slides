#!/usr/bin/env node
/**
 * validate-deck.mjs — static validator for presentation decks (no dependencies, Node >= 18).
 *
 *   node scripts/validate-deck.mjs                 # validates every data/*.json
 *   node scripts/validate-deck.mjs data/x.json     # validates specific files
 *   node scripts/validate-deck.mjs --json          # machine-readable output
 *   node scripts/validate-deck.mjs --strict        # warnings also fail (exit 1)
 *
 * Errors  = the deck will not render correctly (unknown type, missing required field, broken animation code…)
 * Warnings = likely quality problems (too many items, long titles, missing speaker notes…)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THEMES = ['ing', 'marino', 'ocean', 'esmeralda', 'violeta', 'carmin'];
const MODES = ['light', 'dark', 'orange'];
const TRANSITIONS = ['slide', 'fade', 'zoom'];
const COLORS = ['orange', 'navy', 'blue', 'amber', 'sky', 'gray'];
const CHARTS = ['bar', 'hbar', 'horizontalBar', 'line', 'area', 'radar', 'doughnut', 'pie'];

const isStr = v => typeof v === 'string' && v.trim() !== '';
const isArr = Array.isArray;
const words = v => String(v ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
const isUrl = v => /^https?:\/\//i.test(v);

/* Per-type rules.
   req: required string fields · any: at least one of these · arr: { field: [min, max, itemRule] }  (aliases separated by "|") */
const R = {
  cover: { req: ['title'] },
  hero: { req: ['title', 'image'], url: ['image'] },
  features: { req: ['title'], arr: { cards: [1, 4, { req: ['title', 'text'], enums: { style: ['orange', 'navy'] } }] } },
  'number-grid': { req: ['title'], arr: { metrics: [1, 4, { req: ['value', 'label'], digits: ['value'] }] } },
  'split-text': { req: ['title'], arr: { columns: [2, 3, { req: ['title', 'text'] }] } },
  quote: { req: ['text', 'author'] },
  'image-text': { req: ['title', 'image', 'text'], url: ['image'], enums: { layout: ['left-image', 'right-image'] } },
  timeline: { req: ['title'], arr: { steps: [2, 6, { req: ['title'] }] } },
  team: { req: ['title'], arr: { members: [1, 4, { req: ['name', 'role', 'image'], url: ['image'] }] } },
  icons: { req: ['title'], arr: { icons: [1, 8, { req: ['icon', 'title'], enums: { color: ['orange', 'navy', 'blue'] } }] } },
  table: { req: ['title'], custom: 'table' },
  charts: { req: ['title'], custom: 'charts' },
  section: { req: ['title'] },
  agenda: { arr: { items: [1, 7, { str: true, req: ['title'] }] } },
  'big-number': { req: ['value', 'label'], digits: ['value'] },
  bullets: { req: ['title'], arr: { items: [1, 8, { str: true }] } },
  versus: { req: ['title'], custom: 'versus' },
  process: { req: ['title'], arr: { steps: [2, 5, { req: ['title'] }] } },
  bars: { req: ['title'], arr: { items: [1, 6, { req: ['label'], num: ['value'] }] } },
  matrix: { req: ['title'], arr: { quadrants: [1, 4, { req: ['title'], enums: { tone: ['orange', 'navy', 'blue'] } }] } },
  gallery: { req: ['title'], arr: { images: [2, 4, { req: ['image'], url: ['image'] }] } },
  code: { req: ['title', 'code'], custom: 'code' },
  closing: {},
  statement: { any: ['text', 'title'] },
  gauges: { req: ['title'], arr: { 'items|metrics': [1, 4, { req: ['value', 'label'], digits: ['value'] }] } },
  funnel: { req: ['title'], arr: { 'stages|items': [2, 6, { req: ['label', 'value'], digits: ['value'] }] } },
  pyramid: { req: ['title'], arr: { 'levels|items': [2, 5, { req: ['title'] }] } },
  cycle: { req: ['title'], arr: { steps: [3, 6, { req: ['title'] }] } },
  venn: { req: ['title'], arr: { 'sets|items': [2, 3, { req: ['title'] }] } },
  org: { req: ['title'], custom: 'org' },
  gantt: { req: ['title'], custom: 'gantt' },
  plans: { req: ['title'], arr: { 'plans|items': [2, 4, { req: ['name', 'price'] }] } },
  checklist: { req: ['title'], arr: { items: [1, 8, { any: ['text', 'title'], enums: { status: ['done', 'progress', 'todo'] } }] } },
  testimonials: { req: ['title'], arr: { 'items|quotes': [1, 3, { req: ['text', 'author'] }] } },
  faq: { req: ['title'], arr: { items: [1, 6, { req: ['q', 'a'] }] } },
  compare: { req: ['title', 'before', 'after'], url: ['before', 'after'] },
  'image-cards': { req: ['title'], arr: { 'cards|items': [2, 4, { req: ['image', 'title'], url: ['image'] }] } },
  video: { req: ['title'], custom: 'video' },
  logos: { req: ['title'], arr: { 'items|logos': [1, 8, { str: true }] } },
  animation: { custom: 'animation' }
};
export const KNOWN_TYPES = Object.keys(R);

function validateDeck(deck, file) {
  const out = [];
  const E = (slide, msg) => out.push({ severity: 'error', slide, message: msg });
  const W = (slide, msg) => out.push({ severity: 'warning', slide, message: msg });

  if (!deck || typeof deck !== 'object') { E(0, 'Deck must be a JSON object'); return out; }
  const meta = deck.meta ?? {};
  if (!isArr(deck.slides) || !deck.slides.length) { E(0, '"slides" must be a non-empty array'); return out; }
  if (meta.theme && !THEMES.includes(meta.theme)) E(0, `meta.theme "${meta.theme}" is not one of: ${THEMES.join(', ')}`);
  if (meta.transition && !TRANSITIONS.includes(meta.transition)) E(0, `meta.transition "${meta.transition}" is not one of: ${TRANSITIONS.join(', ')}`);
  if (!meta.title) W(0, 'meta.title is missing (used in the footer and the browser tab)');
  if (!['ing', 'marino'].includes(meta.theme ?? 'ing') && !meta.brand && !meta.logo) W(0, 'Themes other than "ing"/"marino" show no logo unless meta.brand or meta.logo is set');

  const slides = deck.slides, n = slides.length;
  const types = slides.map(s => s?.type);
  if (types[0] !== 'cover') W(1, 'The first slide is usually a "cover"');
  if (types[n - 1] !== 'closing') W(n, 'The last slide is usually a "closing"');
  if (n > 40) W(0, `Deck has ${n} slides; consider splitting it`);
  const anims = types.filter(t => t === 'animation').length;
  if (anims > 4) W(0, `${anims} animation slides: use animations sparingly (1–3 per deck)`);

  slides.forEach((s, idx) => {
    const i = idx + 1;
    if (!s || typeof s !== 'object') return E(i, 'Slide must be an object');
    const T = R[s.type];
    if (!T) return E(i, `Unknown slide type "${s.type}". Known types: ${KNOWN_TYPES.join(', ')}`);
    if (s.theme && !MODES.includes(s.theme)) E(i, `theme "${s.theme}" must be one of: ${MODES.join(', ')}`);
    if (s.type !== 'animation' && s.type !== 'section' && s.type !== 'cover' && s.type !== 'closing' && !s.notes) { /* notes optional */ }
    if (idx > 0 && types[idx - 1] === s.type && s.type !== 'section') W(i, `Same slide type "${s.type}" twice in a row: vary the rhythm`);
    if (s.title && words(s.title) > 10) W(i, `Title has ${words(s.title)} words (aim for ≤ 8)`);
    if (s.subtitle && words(s.subtitle) > 28) W(i, `Subtitle has ${words(s.subtitle)} words (aim for ≤ 20)`);

    checkRule(s, T, i, E, W);
    if (T.custom) custom[T.custom](s, i, E, W);
  });
  return out;
}

function checkRule(obj, rule, slide, E, W, path = '') {
  const label = f => (path ? `${path}.` : '') + f;
  (rule.req ?? []).forEach(f => { if (!isStr(obj[f]) && typeof obj[f] !== 'number') E(slide, `Missing required field "${label(f)}"`); });
  if (rule.any && !rule.any.some(f => isStr(obj[f]))) E(slide, `One of ${rule.any.map(label).join(' / ')} is required`);
  (rule.url ?? []).forEach(f => { if (isStr(obj[f]) && !isUrl(obj[f])) W(slide, `"${label(f)}" should be an absolute http(s) URL`); });
  Object.entries(rule.enums ?? {}).forEach(([f, vals]) => { if (obj[f] != null && !vals.includes(obj[f])) E(slide, `"${label(f)}" must be one of: ${vals.join(', ')} (got "${obj[f]}")`); });
  (rule.digits ?? []).forEach(f => { if (isStr(obj[f]) && !/\d/.test(obj[f])) W(slide, `"${label(f)}" ("${obj[f]}") has no digit: it will not animate as a counter`); });
  (rule.num ?? []).forEach(f => { if (obj[f] == null || isNaN(parseFloat(String(obj[f]).replace(',', '.')))) E(slide, `"${label(f)}" must be a number`); });
  Object.entries(rule.arr ?? {}).forEach(([names, [min, max, item]]) => {
    const key = names.split('|').find(k => isArr(obj[k]));
    if (!key) return E(slide, `Missing array "${names.split('|')[0]}"${names.includes('|') ? ` (or ${names.split('|').slice(1).join('/')})` : ''}`);
    const arr = obj[key];
    if (arr.length < min) E(slide, `"${key}" needs at least ${min} item(s) (has ${arr.length})`);
    if (arr.length > max) W(slide, `"${key}" has ${arr.length} items; the layout supports up to ${max} (extra items are cut or shrink the slide)`);
    arr.forEach((it, k) => {
      if (typeof it === 'string') { if (!item.str) E(slide, `"${key}[${k}]" must be an object`); return; }
      if (!it || typeof it !== 'object') return E(slide, `"${key}[${k}]" must be an object`);
      checkRule(it, item, slide, E, W, `${key}[${k}]`);
      ['text', 'desc'].forEach(f => { if (words(it[f]) > 55) W(slide, `"${key}[${k}].${f}" has ${words(it[f])} words (aim for ≤ 40)`); });
    });
  });
  ['text', 'subtitle'].forEach(f => { if (rule === R[obj.type] && words(obj[f]) > 80) W(slide, `"${f}" has ${words(obj[f])} words (aim for ≤ 60)`); });
}

const custom = {
  table(s, i, E, W) {
    if (!isArr(s.headers) || s.headers.length < 2) return E(i, '"headers" must be an array with at least 2 columns');
    if (!isArr(s.rows) || !s.rows.length) return E(i, '"rows" must be a non-empty array');
    if (s.rows.length > 8) W(i, `Table has ${s.rows.length} rows (max 8 recommended)`);
    s.rows.forEach((r, k) => { if (!isArr(r) || r.length !== s.headers.length) E(i, `rows[${k}] must have ${s.headers.length} cells`); });
    if (s.highlight != null && !(Number.isInteger(s.highlight) && s.highlight >= 0 && s.highlight < s.headers.length)) E(i, '"highlight" must be a valid column index');
  },
  charts(s, i, E, W) {
    if (!isArr(s.charts) || !s.charts.length) return E(i, '"charts" must be a non-empty array');
    if (s.charts.length > 3) W(i, 'More than 3 charts do not fit');
    s.charts.forEach((c, k) => {
      if (!CHARTS.includes(c.type)) E(i, `charts[${k}].type must be one of: ${CHARTS.join(', ')}`);
      if (!isArr(c.labels) || !c.labels.length) E(i, `charts[${k}].labels is required`);
      const sets = c.datasets ?? (c.data ? [{ data: c.data }] : null);
      if (!sets) E(i, `charts[${k}] needs "datasets" or "data"`);
      else sets.forEach((d, j) => { if (!isArr(d.data) || (c.labels && d.data.length !== c.labels.length)) E(i, `charts[${k}] dataset ${j}: data length must match labels (${c.labels?.length})`); if (d.color && !COLORS.includes(d.color) && !/^#/.test(d.color)) W(i, `charts[${k}] color "${d.color}" is not a known keyword (${COLORS.join(', ')})`); });
    });
  },
  versus(s, i, E, W) {
    const [l, r] = s.left ? [s.left, s.right] : (s.columns ?? []);
    [['left', l], ['right', r]].forEach(([n, side]) => {
      if (!side || !isStr(side.title)) return E(i, `"${n}" needs a title (use left/right or columns)`);
      if (!isArr(side.items) || side.items.length < 2) E(i, `"${n}.items" needs at least 2 items`);
      else if (side.items.length > 5) W(i, `"${n}.items" has ${side.items.length} items (3–5 recommended)`);
    });
  },
  code(s, i, E, W) {
    const lines = String(s.code).split('\n').length;
    if (lines > 14) W(i, `Code has ${lines} lines (max 14 recommended)`);
    (s.highlight ?? []).forEach(h => { if (!Number.isInteger(h) || h < 1 || h > lines) E(i, `highlight line ${h} is outside 1–${lines}`); });
  },
  org(s, i, E, W) {
    if (!s.root || !isStr(s.root.name)) return E(i, '"root.name" is required');
    const walk = (n, d) => { if (d > 3) return W(i, 'Org chart deeper than 3 levels'); const k = n.children ?? []; if (k.length > (d === 1 ? 4 : 3)) W(i, `"${n.name}" has ${k.length} children (max ${d === 1 ? 4 : 3} recommended)`); k.forEach(c => { if (!isStr(c.name)) E(i, 'Every org node needs a name'); else walk(c, d + 1); }); };
    walk(s.root, 1);
  },
  gantt(s, i, E, W) {
    if (!isArr(s.periods) || s.periods.length < 2) return E(i, '"periods" needs at least 2 entries');
    if (!isArr(s.rows) || !s.rows.length) return E(i, '"rows" must be a non-empty array');
    if (s.rows.length > 7) W(i, 'More than 7 gantt rows do not fit');
    const n = s.periods.length;
    s.rows.forEach((r, k) => {
      if (!isStr(r.label)) E(i, `rows[${k}].label is required`);
      const st = r.start ?? 0, en = r.end ?? (r.span ? st + r.span - 1 : st);
      if (!Number.isInteger(st) || st < 0 || st >= n) E(i, `rows[${k}].start must be an index 0–${n - 1}`);
      if (!Number.isInteger(en) || en < st || en >= n) E(i, `rows[${k}].end must be an index ${st}–${n - 1}`);
    });
    if (s.today != null && !(s.today >= 0 && s.today <= n)) W(i, `"today" should be between 0 and ${n}`);
  },
  video(s, i, E, W) { if (!s.src && !s.poster) W(i, 'Video has neither "src" nor "poster": it will show an empty placeholder'); },
  animation(s, i, E, W) {
    if (s.libs) W(i, '"libs" is not supported by this engine version (three.js support was removed)');
    if (s.params != null && (typeof s.params !== 'object' || isArr(s.params))) E(i, '"params" must be an object');
    let code = null;
    if (s.code != null) {
      if (!isArr(s.code) && typeof s.code !== 'string') return E(i, '"code" must be an array of lines (or a string)');
      if (isArr(s.code) && s.code.some(l => typeof l !== 'string')) return E(i, 'Every entry of "code" must be a string');
      code = isArr(s.code) ? s.code.join('\n') : s.code;
      try { new vm.Script(`(function(api){'use strict';\n${code}\n})`); } catch (e) { E(i, `Animation code has a syntax error: ${e.message}`); }
    } else if (s.src) {
      const p = resolve(ROOT, s.src);
      if (!existsSync(p)) E(i, `Animation file not found: ${s.src} (path is relative to index.html)`);
      else {
        code = readFileSync(p, 'utf8');
        if (!/registerAnimation\s*\(/.test(code)) E(i, `${s.src} must wrap its code in registerAnimation(function (api) { ... })`);
        try { new vm.Script(code, { filename: s.src }); } catch (e) { E(i, `${s.src} has a syntax error: ${e.message}`); }
      }
    } else E(i, 'Animation slides need "code" or "src"');
    if (code) {
      if (!/return\s*\{?\s*frame|return\s+[a-zA-Z_$][\w$]*\s*;?\s*$|return\s*\(?\s*function/m.test(code) && !/return\s*\{[^}]*frame/.test(code)) W(i, 'The animation should end with `return { frame }` (frame(dt, t) draws each frame)');
      if (/\b(fetch|XMLHttpRequest|WebSocket|eval|importScripts)\s*\(/.test(code)) W(i, 'Animation code uses network/eval APIs: avoid them (security and portability)');
      if (/\bdocument\.(cookie|location)|localStorage|sessionStorage/.test(code)) W(i, 'Animation code touches cookies/storage: avoid it');
      if (/#[0-9a-fA-F]{6}\b/.test(code) && !/colors/.test(code)) W(i, 'Hard-coded colors found: prefer api.colors so the animation follows the active theme');
    }
    if (!s.title && !s.caption && s.overlay !== false) { /* pure full-screen is fine */ }
  }
};

/* ---------- CLI ---------- */
function collect(args) {
  const files = [];
  const add = p => { const abs = resolve(process.cwd(), p); const st = existsSync(abs) && statSync(abs); if (!st) { console.error(`Not found: ${p}`); process.exitCode = 2; return; } if (st.isDirectory()) readdirSync(abs).filter(f => f.endsWith('.json')).sort().forEach(f => files.push(join(abs, f))); else files.push(abs); };
  (args.length ? args : [join(ROOT, 'data')]).forEach(add);
  return files;
}
function main() {
  const argv = process.argv.slice(2), flags = argv.filter(a => a.startsWith('--')), json = flags.includes('--json'), strict = flags.includes('--strict');
  const files = collect(argv.filter(a => !a.startsWith('--')));
  const report = []; let errors = 0, warnings = 0;
  for (const f of files) {
    let issues;
    try { issues = validateDeck(JSON.parse(readFileSync(f, 'utf8')), f); }
    catch (e) { issues = [{ severity: 'error', slide: 0, message: `Invalid JSON: ${e.message}` }]; }
    errors += issues.filter(x => x.severity === 'error').length; warnings += issues.filter(x => x.severity === 'warning').length;
    report.push({ file: relative(ROOT, f), issues });
  }
  if (json) console.log(JSON.stringify({ ok: errors === 0 && (!strict || warnings === 0), errors, warnings, files: report }, null, 2));
  else {
    for (const r of report) {
      const e = r.issues.filter(x => x.severity === 'error').length, w = r.issues.length - e;
      console.log(`${e ? '✗' : '✓'} ${r.file}  ${e} error(s), ${w} warning(s)`);
      r.issues.sort((a, b) => a.slide - b.slide).forEach(x => console.log(`    ${x.severity === 'error' ? 'ERROR  ' : 'warning'}  ${x.slide ? `slide ${x.slide}: ` : ''}${x.message}`));
    }
    console.log(`\n${files.length} deck(s) · ${errors} error(s) · ${warnings} warning(s)`);
  }
  if (errors || (strict && warnings)) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
