/**
 * load-style.mjs — read a style file (styles/<id>.js) from Node, for the validator and the agent sync.
 * The file runs in a sandboxed context with a stand-in `api`: render functions are not called, so only the
 * declarative part of the definition (label, themes, rules…) is meaningful here.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const DIR = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'styles');
export const STYLE_ID = /^[a-z0-9][a-z0-9-]*$/;

export const listStyles = () => (existsSync(DIR) ? readdirSync(DIR) : [])
  .filter(f => f.endsWith('.js') && f !== 'index.js' && !f.startsWith('_'))
  .map(f => f.slice(0, -3)).sort();

const stub = () => new Proxy(function () {}, {
  get: (_, k) => (k === Symbol.toPrimitive ? () => '' : stub()),
  apply: () => ''
});

export function loadStyle(id) {
  const file = join(DIR, `${id}.js`);
  if (!existsSync(file)) return { error: `styles/${id}.js not found` };
  let factory = null;
  try {
    vm.runInNewContext(readFileSync(file, 'utf8'), { registerStyle: fn => { factory = fn; } }, { filename: `styles/${id}.js`, timeout: 1000 });
    if (typeof factory !== 'function') return { error: 'the file must call registerStyle(function (api) { ... return { ... }; })' };
    const def = factory(stub());
    if (!def || typeof def !== 'object') return { error: 'the registerStyle function must return the style definition object' };
    return { def };
  } catch (e) { return { error: `could not load it: ${e.message}` }; }
}
