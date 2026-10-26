// Skill catalogue for the agents: the hub's own skills (.claude/skills) plus every personal skill
// copied into skills-library/ by scripts/sync-skills.mjs. Agents get skills only by id from this
// index, so a model can never make the server read an arbitrary path.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TEXT_EXT = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.html']);
const MAX_RESOURCES = 30_000; // chars of reference files inlined next to SKILL.md

const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);

export class SkillLibrary {
  constructor({ root }) {
    this.root = root;
    this.skills = [];
    this.byId = new Map();
    this.syncedAt = null;
  }

  async load() {
    let index = { skills: [] };
    try {
      index = JSON.parse(await fs.readFile(path.join(this.root, 'skills-library', 'index.json'), 'utf8'));
    } catch { /* library not synced yet: fall back to hub skills only */ }
    const skills = index.skills.filter((s) => s.source !== 'hub');
    // Hub skills are always read live from .claude/skills so new ones appear without a re-sync.
    const hubDir = path.join(this.root, '.claude', 'skills');
    for (const name of await fs.readdir(hubDir).catch(() => [])) {
      const text = await fs.readFile(path.join(hubDir, name, 'SKILL.md'), 'utf8').catch(() => null);
      if (!text) continue;
      const description = (text.match(/^description:\s*"?(.*?)"?\s*$/m) || [, ''])[1];
      skills.push({ id: `hub/${name}`, name, description, source: 'hub', path: `.claude/skills/${name}`, category: name.startsWith('hub-') ? 'pipeline' : 'hub' });
    }
    this.skills = skills.sort((a, b) => a.id.localeCompare(b.id));
    this.byId = new Map(this.skills.map((s) => [s.id, s]));
    this.syncedAt = index.syncedAt || null;
    return this;
  }

  // Accepts full ids ("personal/hook-generator") and bare hub names ("social", from older tasks).
  resolve(ref) {
    if (!ref) return null;
    return this.byId.get(ref) || this.byId.get(`hub/${ref}`) || null;
  }

  // Keyword scoring over name, id and description. Name hits weigh most. Hub skills and
  // brand-specific personal skills get a small boost so the house methods win ties.
  search(query, { limit = 25, source = '', category = '', brandHint = '' } = {}) {
    const q = tokens(query);
    const hint = tokens(brandHint);
    const scored = [];
    for (const s of this.skills) {
      if (source && s.source !== source) continue;
      if (category && s.category !== category) continue;
      const name = tokens(`${s.id} ${s.name}`);
      const desc = tokens(s.description);
      let score = 0;
      for (const t of q) {
        if (name.includes(t)) score += 5;
        else if (name.some((n) => n.startsWith(t) || t.startsWith(n))) score += 2;
        if (desc.includes(t)) score += 1;
      }
      if (!q.length) score = 1;
      if (score === 0) continue;
      if (s.source === 'hub') score += 1.5;
      if (hint.some((t) => name.includes(t))) score += 4;
      scored.push({ s, score });
    }
    return scored.sort((a, b) => b.score - a.score || a.s.id.localeCompare(b.s.id)).slice(0, limit).map((x) => x.s);
  }

  // SKILL.md plus small text reference files, for injection into an agent prompt.
  async content(id) {
    const s = this.byId.get(id);
    if (!s) return null;
    const dir = path.join(this.root, s.path);
    const main = await fs.readFile(path.join(dir, 'SKILL.md'), 'utf8');
    let budget = MAX_RESOURCES;
    const resources = [];
    const walk = async (rel) => {
      for (const e of await fs.readdir(path.join(dir, rel), { withFileTypes: true }).catch(() => [])) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) await walk(r);
        else if (r !== 'SKILL.md' && TEXT_EXT.has(path.extname(e.name)) && budget > 0) {
          const text = (await fs.readFile(path.join(dir, r), 'utf8').catch(() => '')).slice(0, budget);
          budget -= text.length;
          resources.push({ path: r, text });
        }
      }
    };
    await walk('');
    return { ...s, main, resources };
  }

  stats() {
    const bySource = {};
    const byCategory = {};
    for (const s of this.skills) {
      bySource[s.source] = (bySource[s.source] || 0) + 1;
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    }
    return { count: this.skills.length, syncedAt: this.syncedAt, bySource, byCategory };
  }
}
