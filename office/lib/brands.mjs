// Read-only views over the hub's brand folders (brands/<slug>/...), plus the two places the
// office writes back into them: approved drafts and LOG.md lines.
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;
const READABLE_EXT = new Set(['.md', '.html', '.csv']);
// data/ holds the owner's private exports; office/ is served through the API, not as files.
const PRIVATE_DIRS = new Set(['data', 'office']);

export class Brands {
  constructor(brandsDir) {
    this.dir = brandsDir;
  }

  async exists(slug) {
    if (!SLUG_RE.test(slug)) return false;
    try {
      return (await fs.stat(path.join(this.dir, slug, 'brand.md'))).isFile();
    } catch {
      return false;
    }
  }

  async list() {
    const entries = await fs.readdir(this.dir, { withFileTypes: true }).catch(() => []);
    const out = [];
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('_') || e.name.startsWith('.')) continue;
      if (!(await this.exists(e.name))) continue;
      out.push(await this.summary(e.name));
    }
    return out;
  }

  async active() {
    return (await fs.readFile(path.join(this.dir, '.active'), 'utf8').catch(() => '')).trim();
  }

  async summary(slug) {
    const md = await fs.readFile(path.join(this.dir, slug, 'brand.md'), 'utf8');
    const name = (md.match(/^#\s*Brand profile:\s*(.+)$/m) || [, slug])[1].trim();
    const colors = [...new Set(md.match(/#[0-9A-Fa-f]{6}\b/g) || [])].slice(0, 5);
    const files = await this.files(slug);
    const has = (re) => files.some((f) => re.test(f.path));
    const stage = has(/^07-analytics\/weekly-review-/) ? 'Growing'
      : has(/^04-content\/posts\//) ? 'Content'
      : has(/^02-strategy\/strategy-summary-/) ? 'Strategy'
      : has(/^reports\/brand-report-/) ? 'Reported' : 'Onboarded';
    const logLines = (await fs.readFile(path.join(this.dir, slug, 'LOG.md'), 'utf8').catch(() => ''))
      .split('\n').filter((l) => /^\d{4}-\d{2}-\d{2}/.test(l));
    return { slug, name, colors, completeness: completeness(md), stage, lastActivity: logLines.at(-1) || null };
  }

  async profile(slug) {
    return fs.readFile(path.join(this.dir, slug, 'brand.md'), 'utf8');
  }

  // Every readable deliverable in the brand folder, newest first.
  async files(slug) {
    const root = path.join(this.dir, slug);
    const out = [];
    const walk = async (rel) => {
      const entries = await fs.readdir(path.join(root, rel), { withFileTypes: true }).catch(() => []);
      for (const e of entries) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
          if (!rel && PRIVATE_DIRS.has(e.name)) continue;
          await walk(r);
        } else if (READABLE_EXT.has(path.extname(e.name))) {
          const st = await fs.stat(path.join(root, r));
          out.push({ path: r, size: st.size, modified: st.mtime.toISOString() });
        }
      }
    };
    await walk('');
    return out.sort((a, b) => b.modified.localeCompare(a.modified));
  }

  // Resolves a user-supplied relative path and refuses anything outside the brand folder,
  // inside a private dir, or with an extension we don't serve.
  async readFile(slug, rel) {
    const root = path.join(this.dir, slug);
    const full = path.resolve(root, String(rel || ''));
    const inside = path.relative(root, full);
    if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) return null;
    if (PRIVATE_DIRS.has(inside.split(path.sep)[0])) return null;
    if (!READABLE_EXT.has(path.extname(full))) return null;
    try {
      return { ext: path.extname(full), content: await fs.readFile(full, 'utf8') };
    } catch {
      return null;
    }
  }

  // Context handed to agents: the profile plus the latest voice/messaging/customer files.
  async agentContext(slug) {
    const parts = [`## brand.md\n${(await this.profile(slug)).slice(0, 12000)}`];
    const files = await this.files(slug);
    for (const prefix of ['02-strategy/brand-positioning-', '02-strategy/product-marketing-', '01-intel/customer-research-', '02-strategy/strategy-summary-']) {
      const f = files.find((x) => x.path.startsWith(prefix));
      if (f) parts.push(`## ${f.path}\n${(await fs.readFile(path.join(this.dir, slug, f.path), 'utf8')).slice(0, 6000)}`);
    }
    return parts.join('\n\n');
  }

  async appendLog(slug, line) {
    const date = new Date().toISOString().slice(0, 10);
    await fs.appendFile(path.join(this.dir, slug, 'LOG.md'), `${date} · office · ${line}\n`);
  }

  async saveApproved(slug, draft) {
    const folder = draft.kind === 'outreach' ? '06-demand/outreach' : '04-content/approved';
    const rel = `${folder}/${new Date().toISOString().slice(0, 10)}-${draft.id}.md`;
    const full = path.join(this.dir, slug, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    const body = [
      `# ${draft.title || draft.id}`,
      '',
      `- Draft: ${draft.id} · Task: ${draft.taskId || 'n/a'} · Platform: ${draft.platform || 'n/a'}`,
      `- Approved: ${new Date().toISOString()} · Status: ready to post manually`,
      '',
      draft.body,
      '',
    ].join('\n');
    await fs.writeFile(full, body);
    return rel;
  }
}

// Share of "- **Field:** value" lines that are filled in and not TODO.
export function completeness(md) {
  const fields = md.split('\n').filter((l) => /^\s*-\s+\*\*[^*]+:\*\*/.test(l));
  if (!fields.length) return 0;
  const filled = fields.filter((l) => !/TODO/.test(l) && l.replace(/^\s*-\s+\*\*[^*]+:\*\*/, '').trim().length > 0);
  return Math.round((filled.length / fields.length) * 100);
}
