#!/usr/bin/env node
/**
 * sync-agents.mjs — single source of truth for AI agents and skills (Claude Code, GitHub Copilot, Codex).
 *
 *   node scripts/sync-agents.mjs            # generate / update everything
 *   node scripts/sync-agents.mjs --check    # verify nothing is out of date (exit 1 on drift) — used by CI
 *   node scripts/sync-agents.mjs --copy-skills   # copy skills into .claude/skills instead of symlinking (Windows)
 *
 * Source (edit these):
 *   .agents/skills/<name>/SKILL.md      Agent Skills (open standard) — read directly by Codex and Copilot
 *   .agents/agents/<name>.md            Neutral agent definitions
 *   scripts/prompt-header.en.md         Header of the English chat prompt
 * Generated (never edit by hand):
 *   .claude/skills  → symlink to ../.agents/skills (Claude Code, also read by Copilot)
 *   .claude/agents/<name>.md            Claude Code subagents
 *   .github/agents/<name>.agent.md      GitHub Copilot custom agents
 *   .codex/agents/<name>.toml           Codex custom agents
 *   prompt.en.md                        Paste-into-any-chat prompt (schema + animation rules)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, lstatSync, symlinkSync, readlinkSync, rmSync, cpSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), CHECK = args.includes('--check'), COPY = args.includes('--copy-skills');
const SKILLS = join(ROOT, '.agents/skills'), AGENTS = join(ROOT, '.agents/agents');
const problems = [], changed = [];
const bad = m => problems.push(m);
const rel = p => relative(ROOT, p);

/* ---------- parsing ---------- */
function parseDoc(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { bad(`${file}: missing YAML frontmatter`); return { fm: {}, body: text }; }
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/); if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, '');
    fm[kv[1]] = v;
  }
  return { fm, body: m[2].replace(/^\n+/, '').replace(/\s+$/, '') + '\n' };
}
const section = (md, heading) => { const i = md.indexOf(heading + '\n'); if (i < 0) return ''; const rest = md.slice(i + heading.length + 1); const j = rest.search(/^## /m); return (j < 0 ? rest : rest.slice(0, j)).trim(); };

/* ---------- validation of the sources ---------- */
const TOOLS = ['read', 'edit', 'search', 'run', 'web', 'inherit'];
const skills = [];
for (const d of existsSync(SKILLS) ? readdirSync(SKILLS).sort() : []) {
  const dir = join(SKILLS, d); if (!statSync(dir).isDirectory()) continue;
  const f = join(dir, 'SKILL.md'); if (!existsSync(f)) { bad(`${rel(dir)}: SKILL.md is missing`); continue; }
  const { fm, body } = parseDoc(readFileSync(f, 'utf8'), rel(f));
  if (fm.name !== d) bad(`${rel(f)}: frontmatter name "${fm.name}" must equal the directory name "${d}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d) || d.length > 64) bad(`${rel(f)}: invalid skill name`);
  if (!fm.description || fm.description.length > 1024) bad(`${rel(f)}: description is required and must be ≤ 1024 characters`);
  if (body.trim().length < 200) bad(`${rel(f)}: body is too short`);
  for (const l of body.matchAll(/\]\((references\/[^)#\s]+|scripts\/[^)#\s]+)\)/g)) if (!existsSync(join(dir, l[1]))) bad(`${rel(f)}: broken link ${l[1]}`);
  skills.push({ name: d, desc: fm.description });
}
const agents = [];
for (const f of existsSync(AGENTS) ? readdirSync(AGENTS).filter(x => x.endsWith('.md')).sort() : []) {
  const { fm, body } = parseDoc(readFileSync(join(AGENTS, f), 'utf8'), `.agents/agents/${f}`);
  const name = f.replace(/\.md$/, '');
  if (fm.name !== name) bad(`.agents/agents/${f}: name "${fm.name}" must equal the file name "${name}"`);
  if (!fm.description) bad(`.agents/agents/${f}: description is required`);
  const tools = Array.isArray(fm.tools) ? fm.tools : fm.tools ? [fm.tools] : ['inherit'];
  tools.forEach(t => { if (!TOOLS.includes(t)) bad(`.agents/agents/${f}: unknown tool "${t}" (allowed: ${TOOLS.join(', ')})`); });
  const sk = Array.isArray(fm.skills) ? fm.skills : [];
  sk.forEach(s => { if (!skills.some(x => x.name === s)) bad(`.agents/agents/${f}: unknown skill "${s}"`); });
  if (!['read-only', 'workspace-write'].includes(fm.sandbox ?? 'workspace-write')) bad(`.agents/agents/${f}: sandbox must be read-only or workspace-write`);
  if (body.includes("'''")) bad(`.agents/agents/${f}: body must not contain ''' (breaks the TOML output)`);
  agents.push({ name, description: fm.description, tools, skills: sk, sandbox: fm.sandbox ?? 'workspace-write', body });
}

/* ---------- generators ---------- */
const BANNER = n => `GENERATED from .agents/agents/${n}.md by scripts/sync-agents.mjs — do not edit; edit the source and run \`npm run sync\`.`;
const CLAUDE_TOOLS = { read: ['Read', 'Grep', 'Glob'], edit: ['Edit', 'Write'], search: ['Grep', 'Glob'], run: ['Bash'], web: ['WebFetch', 'WebSearch'] };
const COPILOT_TOOLS = { read: 'read', edit: 'edit', search: 'search', run: 'execute', web: 'web' };
const uniq = a => [...new Set(a)];
const q = JSON.stringify;

const out = new Map();   // path → content
for (const a of agents) {
  const inherit = a.tools.includes('inherit');
  // Claude Code
  out.set(`.claude/agents/${a.name}.md`, [
    '---', `name: ${a.name}`, `description: ${q(a.description)}`,
    ...(inherit ? [] : [`tools: ${uniq(a.tools.flatMap(t => CLAUDE_TOOLS[t])).join(', ')}`]),
    ...(a.skills.length ? ['skills:', ...a.skills.map(s => `  - ${s}`)] : []),
    '---', `<!-- ${BANNER(a.name)} -->`, '', a.body].join('\n'));
  // GitHub Copilot
  out.set(`.github/agents/${a.name}.agent.md`, [
    '---', `name: ${a.name}`, `description: ${q(a.description)}`,
    ...(inherit ? [] : [`tools: [${uniq(a.tools.map(t => COPILOT_TOOLS[t])).map(q).join(', ')}]`]),
    '---', `<!-- ${BANNER(a.name)} -->`, '', a.body].join('\n'));
  // Codex
  out.set(`.codex/agents/${a.name}.toml`, [
    `# ${BANNER(a.name)}`, `name = ${q(a.name)}`, `description = ${q(a.description)}`, `sandbox_mode = ${q(a.sandbox)}`,
    `developer_instructions = '''`, a.body.trimEnd(), `'''`, ''].join('\n'));
}

// English prompt for any chat LLM
const header = existsSync(join(ROOT, 'scripts/prompt-header.en.md')) ? readFileSync(join(ROOT, 'scripts/prompt-header.en.md'), 'utf8').trim() : '';
const catalog = readFileSync(join(SKILLS, 'create-presentation/references/slide-types.md'), 'utf8').replace(/^# .*\n+/, '').replace('See the `create-animation` skill for the API.', 'See the animation code rules below.');
const animSkill = readFileSync(join(SKILLS, 'create-animation/SKILL.md'), 'utf8');
const animApi = readFileSync(join(SKILLS, 'create-animation/references/api.md'), 'utf8').replace(/^# .*\n+/, '').replace(/^## Metadata used by the validator[\s\S]*$/m, '').trim();
out.set('prompt.en.md', [
  `<!-- ${'GENERATED by scripts/sync-agents.mjs from scripts/prompt-header.en.md + the create-presentation / create-animation skills — do not edit.'} -->`,
  header, '', '# Slide type catalog', '', catalog.trim(), '', '# Animation code', '',
  section(animSkill, '## Contract').split('\n').filter(l => !l.includes('](references/')).join('\n').replace(/\n{3,}/g, '\n\n'), '', '## Rules', '', section(animSkill, '## Rules'), '', '## `api` reference', '', animApi, '',
  '# Content to turn into a presentation', '', '[PASTE THE SUMMARY, DOCUMENT, DATA OR IDEA HERE]', ''].join('\n'));

/* ---------- write / check ---------- */
const same = (p, c) => existsSync(p) && readFileSync(p, 'utf8') === c;
for (const [path, content] of out) {
  const abs = join(ROOT, path);
  if (same(abs, content)) continue;
  changed.push(path);
  if (!CHECK) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); }
}
// remove stale generated agent files
for (const [dir, ext] of [['.claude/agents', '.md'], ['.github/agents', '.agent.md'], ['.codex/agents', '.toml']]) {
  const abs = join(ROOT, dir); if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) if (f.endsWith(ext) && !out.has(`${dir}/${f}`)) { changed.push(`${dir}/${f} (stale)`); if (!CHECK) rmSync(join(abs, f)); }
}
// .claude/skills → symlink (or copy)
const link = join(ROOT, '.claude/skills');
const isLink = existsSync(link) || (() => { try { return lstatSync(link).isSymbolicLink(); } catch { return false; } })();
let skillsOk = false;
try {
  const st = lstatSync(link);
  if (st.isSymbolicLink()) skillsOk = !COPY && readlinkSync(link) === '../.agents/skills';
  else if (st.isDirectory()) skillsOk = COPY && JSON.stringify(readdirSync(link).sort()) === JSON.stringify(readdirSync(SKILLS).sort());
} catch { /* missing */ }
if (!skillsOk) {
  changed.push('.claude/skills' + (COPY ? ' (copy)' : ' (symlink)'));
  if (!CHECK) {
    mkdirSync(join(ROOT, '.claude'), { recursive: true }); rmSync(link, { recursive: true, force: true });
    if (COPY) cpSync(SKILLS, link, { recursive: true });
    else { try { symlinkSync('../.agents/skills', link, 'dir'); } catch (e) { cpSync(SKILLS, link, { recursive: true }); console.warn('Symlinks unavailable here; copied skills instead (re-run with --copy-skills to keep them in sync).'); } }
  }
}

problems.forEach(p => console.error('✗ ' + p));
if (CHECK) {
  if (changed.length) { console.error(`✗ Out of date (run \`npm run sync\`):\n  ${changed.join('\n  ')}`); }
  if (problems.length || changed.length) process.exit(1);
  console.log(`✓ ${skills.length} skills and ${agents.length} agents are valid and in sync`);
} else {
  if (problems.length) process.exit(1);
  console.log(changed.length ? `Updated:\n  ${changed.join('\n  ')}` : 'Everything already up to date');
  console.log(`✓ ${skills.length} skills · ${agents.length} agents → Claude (.claude/), Copilot (.github/agents) and Codex (.codex/agents)`);
}
