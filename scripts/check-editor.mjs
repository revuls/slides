#!/usr/bin/env node
/** check-editor.mjs — keeps editor/schema.js in step with the validator: every slide type has a form, a valid sample, its required fields and the same list limits. */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { RULES, KNOWN_TYPES, validateDeck } from './validate-deck.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.runInNewContext(readFileSync(resolve(ROOT, 'editor/schema.js'), 'utf8'), ctx, { filename: 'editor/schema.js' });
const { types } = ctx.window.SLIDE_SCHEMA;

const errors = [];
const E = (type, msg) => errors.push(`${type}: ${msg}`);
const has = (fields, k) => fields.some(f => f.k === k || f.alt === k);
function checkRule(type, fields, rule, where = '') {
  (rule.req ?? []).forEach(k => { const f = fields.find(x => x.k === k || x.alt === k); if (!f) E(type, `${where}required field "${k}" has no form field`); else if (!f.req) E(type, `${where}"${k}" is required by the validator but not marked req`); });
  (rule.any ?? []).forEach(k => { if (!has(fields, k)) E(type, `${where}field "${k}" has no form field`); });
  Object.entries(rule.arr ?? {}).forEach(([names, [min, max, item]]) => {
    const [k, ...alias] = names.split('|'), f = fields.find(x => x.k === k);
    if (!f) return E(type, `${where}list "${k}" has no form field`);
    if (f.min !== min || f.max !== max) E(type, `${where}list "${k}" limits are ${f.min}–${f.max}; the validator says ${min}–${max}`);
    alias.forEach(a => { if (!f.alias?.includes(a)) E(type, `${where}list "${k}" does not accept alias "${a}"`); });
    if (item.str && !f.str) E(type, `${where}list "${k}" items may be strings: set "str"`);
    checkRule(type, f.fields, item, `${where}${k}[].`);
  });
  Object.entries(rule.enums ?? {}).forEach(([k, vals]) => {
    const f = fields.find(x => x.k === k); if (!f) return E(type, `${where}enum "${k}" has no form field`);
    vals.forEach(v => { if (!f.options?.some(o => o[0] === v) && f.def !== v) E(type, `${where}"${k}" does not offer "${v}"`); });
  });
}

KNOWN_TYPES.filter(t => !types[t]).forEach(t => E(t, 'no form in editor/schema.js'));
Object.keys(types).filter(t => !RULES[t]).forEach(t => E(t, 'in editor/schema.js but unknown to the validator'));
for (const t of KNOWN_TYPES) {
  const T = types[t]; if (!T) continue;
  checkRule(t, T.fields, RULES[t]);
  if (!T.label || !T.group || !T.icon) E(t, 'needs label, group and icon');
  // A freshly added slide must validate without errors
  validateDeck({ meta: { title: 'x' }, slides: [T.sample] }, 'sample').filter(i => i.severity === 'error').forEach(i => E(t, `sample: ${i.message}`));
}

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); console.error(`\neditor/schema.js: ${errors.length} problem(s)`); process.exitCode = 1; }
else console.log(`✓ editor/schema.js covers ${KNOWN_TYPES.length} slide types`);
