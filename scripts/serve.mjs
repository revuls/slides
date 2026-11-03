#!/usr/bin/env node
/** serve.mjs — tiny static server with no dependencies. Usage: node scripts/serve.mjs [port]   (default 8765) */
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, writeFile, rename, stat, mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { resolve, extname, join, dirname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDeck } from './validate-deck.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8765);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif', '.webp': 'image/webp', '.ico': 'image/x-icon' };

/* ---------- Editor API: lets the visual editor save decks. Only for this machine ---------- */
const DECK_PATH = /^data\/[\w-][\w.-]*\.json$/, DECK_SLUG = /^[\w-][\w.-]*$/;
const IMAGE_TYPES = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };   // no SVG: it could run scripts from this origin
const MAX_DECK = 32 << 20, MAX_IMAGE = 25 << 20, KEEP_BACKUPS = 10;
const hashOf = text => createHash('sha256').update(text).digest('hex').slice(0, 16);
const sendJSON = (res, code, obj) => res.writeHead(code, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' }).end(JSON.stringify(obj));
// Loopback peer, loopback Host (blocks DNS rebinding) and same Origin (blocks other web pages)
function isLocal(req) {
  const peer = req.socket.remoteAddress || '', host = req.headers.host || '', origin = req.headers.origin;
  if (!/^(127\.|::1$|::ffff:127\.)/.test(peer) || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  try { return !origin || new URL(origin).host === host; } catch { return false; }
}
function readBody(req, max) {
  return new Promise((ok, ko) => {
    const parts = []; let n = 0;
    req.on('data', d => { n += d.length; if (n > max) { ko(Object.assign(new Error('Too large'), { code: 413 })); req.destroy(); } else parts.push(d); });
    req.on('end', () => ok(Buffer.concat(parts))); req.on('error', ko);
  });
}
async function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, data);
  try { await rename(tmp, file); } catch (e) { await rm(tmp, { force: true }); throw e; }
}
async function backup(file) {
  const dir = join(dirname(file), '.backups'), name = basename(file, '.json');
  await mkdir(dir, { recursive: true });
  await copyFile(file, join(dir, `${name}.${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
  const old = (await readdir(dir)).filter(f => f.startsWith(name + '.') && /^\d{4}-/.test(f.slice(name.length + 1))).sort().slice(0, -KEEP_BACKUPS);
  await Promise.all(old.map(f => rm(join(dir, f), { force: true })));
}
const listAnimations = async () => (await readdir(join(ROOT, 'animations'))).filter(f => f.endsWith('.js')).sort().map(f => 'animations/' + f);
const checkDeck = (deck, rel) => { try { return validateDeck(deck, rel); } catch (e) { return [{ severity: 'warning', slide: 0, message: 'Validator failed: ' + e.message }]; } };

async function handleApi(req, res, url) {
  if (!isLocal(req)) return sendJSON(res, 403, { error: 'The editor API only accepts requests from this machine' });
  const route = url.pathname.replace(/^\/api\//, '');
  if (route === 'deck') {
    const rel = url.searchParams.get('path') || '';
    if (!DECK_PATH.test(rel)) return sendJSON(res, 400, { error: 'Only data/*.json decks can be edited' });
    const file = join(ROOT, rel);
    const current = await readFile(file, 'utf8').catch(() => null);
    if (current == null) return sendJSON(res, 404, { error: 'Deck not found' });
    if (req.method === 'GET') { const deck = JSON.parse(current); return sendJSON(res, 200, { hash: hashOf(current), deck, issues: checkDeck(deck, rel), animations: await listAnimations() }); }
    if (req.method !== 'PUT') return sendJSON(res, 405, { error: 'Method not allowed' });
    if (!/^application\/json\b/.test(req.headers['content-type'] || '')) return sendJSON(res, 415, { error: 'Expected application/json' });
    const base = url.searchParams.get('base');
    if (base && base !== hashOf(current)) return sendJSON(res, 409, { error: 'The file changed on disk', hash: hashOf(current) });
    const text = (await readBody(req, MAX_DECK)).toString('utf8');
    let deck; try { deck = JSON.parse(text); } catch (e) { return sendJSON(res, 400, { error: 'Invalid JSON: ' + e.message }); }
    if (!Array.isArray(deck?.slides) || !deck.slides.length) return sendJSON(res, 400, { error: '"slides" must be a non-empty array' });
    if (url.searchParams.get('backup')) await backup(file);
    await writeAtomic(file, text);
    return sendJSON(res, 200, { hash: hashOf(text), issues: checkDeck(deck, rel) });
  }
  if (route === 'asset' && req.method === 'POST') {
    const ext = IMAGE_TYPES[(req.headers['content-type'] || '').split(';')[0].trim()], slug = url.searchParams.get('deck') || '';
    if (!ext) return sendJSON(res, 415, { error: 'Only PNG, JPG, WebP, GIF and AVIF images can be uploaded' });
    if (!DECK_SLUG.test(slug)) return sendJSON(res, 400, { error: 'Invalid deck name' });
    const clean = (url.searchParams.get('name') || 'imagen').replace(/\.[^.]*$/, '').normalize('NFD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'imagen';
    const data = await readBody(req, MAX_IMAGE), dir = join(ROOT, 'assets', slug);
    await mkdir(dir, { recursive: true });
    let name = clean + ext;
    for (let n = 2; await stat(join(dir, name)).then(() => true, () => false); n++) name = `${clean}-${n}${ext}`;
    await writeAtomic(join(dir, name), data);
    return sendJSON(res, 200, { path: `assets/${slug}/${name}` });
  }
  return sendJSON(res, 404, { error: 'Unknown API route' });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) {
      try { return await handleApi(req, res, url); }
      catch (e) { console.error(e); return res.headersSent ? res.end() : sendJSON(res, e.code === 413 ? 413 : 500, { error: e.message }); }
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }
    await stat(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
}).listen(PORT, () => {
  console.log(`Slides running at http://localhost:${PORT}`);
  console.log(`Open a deck:  http://localhost:${PORT}/?src=data/sistema-solar.json`);
});
