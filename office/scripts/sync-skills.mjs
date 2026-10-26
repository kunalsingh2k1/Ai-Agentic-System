// Copies every skill synced to the owner's personal Claude account (~/.claude/skills/synced and
// ~/.claude/plugins/synced) into skills-library/<source>/<skill>/ and writes skills-library/index.json.
// The project's own hub skills (.claude/skills) are indexed in place, not copied.
// Re-run any time: npm run sync-skills   (from office/)
import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = path.join(ROOT, 'skills-library');
const HOME_CLAUDE = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude');
const SKIP_DIRS = new Set(['.staging', '.git', 'node_modules', '__pycache__']);

// Minimal frontmatter reader: name + description, including quoted and folded (>, |) values.
export function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const lines = m[1].split(/\r?\n/);
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^(name|description):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v === '>' || v === '|' || v === '>-' || v === '|-' || v === '') {
      const parts = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) parts.push(lines[++i].trim());
      v = parts.join(' ');
    }
    out[kv[1]] = v.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
  }
  return out;
}

const CATEGORIES = [
  ['seo', /\bseo\b|search engine|keyword|geo\b|aeo|schema|serp/i],
  ['social', /instagram|reel|carousel|tiktok|linkedin|social|post-writer|hook|caption|youtube|profile/i],
  ['ads', /\bads?\b|campaign|meta ads|google ads|ppc|paid/i],
  ['content', /content|copy|blog|newsletter|email|script|writer|brief|draft/i],
  ['design', /design|canva|figma|brand|visual|graphic|image|infographic|ui\b|ux\b|art|theme/i],
  ['sales', /sales|lead|prospect|crm|outreach|apollo|pipeline|deal/i],
  ['analytics', /analytic|metric|report|dashboard|tracking|data\b/i],
  ['strategy', /strategy|strategist|plan|positioning|market|research|competitive|mckinsey/i],
  ['business', /small-business|operations|finance|invoice|legal|hr\b|support/i],
];
export function categorise(s) {
  return (CATEGORIES.find(([, re]) => re.test(s)) || ['other'])[0];
}

async function findSkillFiles(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await findSkillFiles(p, out);
    else if (e.name === 'SKILL.md') out.push(p);
  }
  return out;
}

async function pluginName(pluginDir) {
  for (const f of ['.claude-plugin/plugin.json', 'plugin.json']) {
    try {
      return JSON.parse(await fs.readFile(path.join(pluginDir, f), 'utf8')).name;
    } catch { /* try next */ }
  }
  try {
    return JSON.parse(await fs.readFile(`${pluginDir}.meta.json`, 'utf8')).name;
  } catch { /* fall back to folder name */ }
  return path.basename(pluginDir);
}

const safe = (s) => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'skill';

async function collectSources() {
  const sources = []; // { source, skillFile }
  const personalRoot = path.join(HOME_CLAUDE, 'skills', 'synced');
  for (const bucket of await fs.readdir(personalRoot).catch(() => [])) {
    if (bucket.startsWith('.')) continue;
    for (const f of await findSkillFiles(path.join(personalRoot, bucket))) sources.push({ source: 'personal', skillFile: f });
  }
  const pluginRoot = path.join(HOME_CLAUDE, 'plugins', 'synced');
  for (const bucket of await fs.readdir(pluginRoot).catch(() => [])) {
    if (bucket.startsWith('.')) continue;
    const bucketDir = path.join(pluginRoot, bucket);
    for (const e of await fs.readdir(bucketDir, { withFileTypes: true }).catch(() => [])) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
      const dir = path.join(bucketDir, e.name);
      const name = safe(await pluginName(dir));
      for (const f of await findSkillFiles(dir)) sources.push({ source: name, skillFile: f });
    }
  }
  return sources;
}

export async function sync({ log = console.log } = {}) {
  const found = await collectSources();
  await fs.rm(LIB, { recursive: true, force: true });
  await fs.mkdir(LIB, { recursive: true });
  const index = [];
  const used = new Set();
  for (const { source, skillFile } of found) {
    const text = await fs.readFile(skillFile, 'utf8');
    const fm = frontmatter(text);
    const base = safe(fm.name || path.basename(path.dirname(skillFile)));
    let id = `${source}/${base}`;
    for (let n = 2; used.has(id); n++) id = `${source}/${base}-${n}`;
    used.add(id);
    const dest = path.join(LIB, id);
    await fs.cp(path.dirname(skillFile), dest, { recursive: true, filter: (p) => !SKIP_DIRS.has(path.basename(p)) });
    const description = (fm.description || '').slice(0, 600);
    index.push({ id, name: fm.name || base, description, source, path: path.relative(ROOT, dest), category: categorise(`${id} ${description}`) });
  }
  // Hub skills stay where Claude Code loads them; indexed so agents can use them too.
  const hubDir = path.join(ROOT, '.claude', 'skills');
  for (const f of await findSkillFiles(hubDir)) {
    const fm = frontmatter(await fs.readFile(f, 'utf8'));
    const name = path.basename(path.dirname(f));
    index.push({ id: `hub/${name}`, name, description: (fm.description || '').slice(0, 600), source: 'hub', path: path.relative(ROOT, path.dirname(f)), category: name.startsWith('hub-') ? 'pipeline' : categorise(`${name} ${fm.description}`) });
  }
  index.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(path.join(LIB, 'index.json'), JSON.stringify({ syncedAt: new Date().toISOString(), count: index.length, skills: index }, null, 2));
  await fs.writeFile(path.join(LIB, 'README.md'), `# Skills library\n\nCopied from your personal Claude account by \`office/scripts/sync-skills.mjs\` on ${new Date().toISOString().slice(0, 10)}.\nRe-run with \`cd office && npm run sync-skills\`. This folder is git-ignored: it is re-creatable, and it contains third-party skills that shouldn't be redistributed.\n\n${index.length} skills indexed in index.json (hub skills are indexed from .claude/skills).\n`);
  const bySource = index.reduce((m, s) => ((m[s.source] = (m[s.source] || 0) + 1), m), {});
  log(`Indexed ${index.length} skills (${found.length} copied from ~/.claude, ${bySource.hub || 0} hub).`);
  return { count: index.length, bySource };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(HOME_CLAUDE)) {
    console.error(`No Claude folder at ${HOME_CLAUDE}. Set CLAUDE_HOME.`);
    process.exit(1);
  }
  const { bySource } = await sync();
  console.log(Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s}: ${n}`).join(', '));
}
