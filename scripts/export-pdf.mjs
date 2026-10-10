#!/usr/bin/env node
/**
 * export-pdf.mjs — export a deck to PDF without opening the print dialog (headless Chrome/Edge/Chromium, no npm dependencies).
 * Usage: node scripts/export-pdf.mjs data/<deck>.json [out.pdf] [--theme=ocean]
 * Set CHROME_PATH if the browser is not found automatically. Needs network access for fonts/icons (same as the app).
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve, extname, join, dirname, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opts = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const [deckArg, outArg] = args.filter(a => !a.startsWith('--'));
if (!deckArg) { console.error('Usage: node scripts/export-pdf.mjs data/<deck>.json [out.pdf] [--theme=name]'); process.exit(1); }
const deck = resolve(deckArg);
if (!existsSync(deck)) { console.error(`Deck not found: ${deckArg}`); process.exit(1); }
const out = resolve(outArg || deck.replace(/\.json$/i, '') + '.pdf');
const rel = relative(ROOT, deck).split('\\').join('/');
if (rel.startsWith('..')) { console.error('The deck must live inside this repository (e.g. data/).'); process.exit(1); }

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);
const onPath = c => (process.env.PATH || '').split(process.platform === 'win32' ? ';' : ':').some(d => existsSync(join(d, c)));
const chrome = CANDIDATES.find(c => (c.includes('/') || c.includes('\\') ? existsSync(c) : onPath(c)));
if (!chrome) { console.error('Chrome/Edge/Chromium not found. Set CHROME_PATH=/path/to/browser.'); process.exit(1); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p)); if (!file.startsWith(ROOT)) throw 0;
    await stat(file); res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }); res.end(await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/?src=${encodeURIComponent(rel)}&print${opts.theme ? '&theme=' + encodeURIComponent(opts.theme) : ''}`;

const profile = await mkdtemp(join(tmpdir(), 'slides-pdf-')), tmpPdf = join(profile, 'out.pdf');   // Chrome writes here; the real output is only replaced on success
// Chrome writes the PDF but may not exit on its own: wait for a non-empty, stable file, then close it.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-pdf-header-footer', `--user-data-dir=${profile}`,
  '--run-all-compositor-stages-before-draw', '--virtual-time-budget=' + (opts.wait || 20000), `--print-to-pdf=${tmpPdf}`, url], { stdio: 'ignore' });
let exited = false, code = 1; child.on('exit', c => { exited = true; code = c; }); child.on('error', e => { console.error(e.message); exited = true; });
let last = -1;
for (let t = 0; t < 600 && !exited; t++) {   // up to ~5 min
  await sleep(500);
  const size = existsSync(tmpPdf) ? statSync(tmpPdf).size : 0;
  if (size > 1000 && size === last) { code = 0; break; }
  last = size;
}
if (!exited) child.kill();
server.close();
const ok = code === 0 && existsSync(tmpPdf) && statSync(tmpPdf).size >= 1000;
if (ok) await copyFile(tmpPdf, out);
await rm(profile, { recursive: true, force: true }).catch(() => {});
if (!ok) { console.error('PDF export failed (exit ' + code + ').'); process.exit(1); }
const shown = relative(process.cwd(), out); console.log(`✓ ${shown.startsWith('..') ? out : shown}  (${(statSync(out).size / 1048576).toFixed(1)} MB)`);
