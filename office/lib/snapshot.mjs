// Before/after snapshots of a brand folder around an edit-capable agent run, so every change
// the agent made can be listed for review and undone. office/ and data/ are excluded (the agent
// can't write there, and office/ changes constantly from the server itself).
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const EXCLUDE_TOP = new Set(['office', 'data']);
const TEXT_EXT = new Set(['.md', '.html', '.csv', '.json', '.txt', '.svg', '.css', '.js', '.xml', '.yaml', '.yml']);
const MAX_FILE = 2_000_000;

const sha1 = (buf) => createHash('sha1').update(buf).digest('hex');

// Map of relative path → { hash, text } (text only for text files, so they can be restored).
export async function snapshot(dir) {
  const files = new Map();
  const walk = async (rel) => {
    for (const e of await fs.readdir(path.join(dir, rel), { withFileTypes: true }).catch(() => [])) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (!rel && EXCLUDE_TOP.has(e.name)) continue;
      if (e.isDirectory()) await walk(r);
      else if (e.isFile()) {
        const full = path.join(dir, r);
        const st = await fs.stat(full);
        if (st.size > MAX_FILE) {
          files.set(r, { hash: `size:${st.size}:${st.mtimeMs}`, text: null });
          continue;
        }
        const buf = await fs.readFile(full);
        files.set(r, { hash: sha1(buf), text: TEXT_EXT.has(path.extname(r)) ? buf.toString('utf8') : null });
      }
    }
  };
  await walk('');
  return files;
}

export function diff(before, after) {
  const changes = [];
  for (const [p, a] of after) {
    const b = before.get(p);
    if (!b) changes.push({ path: p, change: 'created' });
    else if (b.hash !== a.hash) changes.push({ path: p, change: 'modified' });
  }
  for (const p of before.keys()) if (!after.has(p)) changes.push({ path: p, change: 'deleted' });
  return changes.sort((x, y) => x.path.localeCompare(y.path));
}

// What undo needs: the old text of each changed file and the hash the agent left behind.
export function undoRecord(before, after, changes) {
  return changes.map((c) => ({
    ...c,
    beforeText: before.get(c.path)?.text ?? null,
    afterHash: after.get(c.path)?.hash ?? null,
  }));
}

// Restores a run's changes. Files edited again since the run (hash differs) are left alone and
// reported as conflicts, so undo never destroys newer work.
export async function restore(dir, record) {
  const restored = [];
  const conflicts = [];
  for (const c of record) {
    const full = path.join(dir, c.path);
    if (path.relative(dir, full).startsWith('..')) continue;
    let current = null;
    try {
      current = sha1(await fs.readFile(full));
    } catch { /* missing */ }
    if (c.change !== 'deleted' && current !== c.afterHash) {
      conflicts.push(`${c.path} (changed again since the run)`);
      continue;
    }
    if (c.change === 'created') {
      await fs.rm(full, { force: true });
      restored.push(c.path);
    } else if (c.beforeText === null) {
      conflicts.push(`${c.path} (not a text file, can't restore)`);
    } else {
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, c.beforeText);
      restored.push(c.path);
    }
  }
  return { restored, conflicts };
}
