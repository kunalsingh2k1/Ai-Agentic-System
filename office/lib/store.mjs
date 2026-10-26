// JSON-file store. One file per collection per brand: brands/<slug>/office/<collection>.json
// Chosen over a database because volumes are small (hundreds of rows per brand) and the files
// stay readable and diffable next to the brand's other work. See docs/DECISIONS.md D-003.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PREFIX = { tasks: 'T', drafts: 'D', leads: 'L', runs: 'R', log: 'G', routines: 'W' };
const CAPS = { runs: 500 }; // keep run history bounded

export class Store {
  constructor(brandsDir) {
    this.brandsDir = brandsDir;
    this.queues = new Map();
  }

  file(slug, collection) {
    if (!PREFIX[collection]) throw new Error(`Unknown collection ${collection}`);
    return path.join(this.brandsDir, slug, 'office', `${collection}.json`);
  }

  async read(slug, collection) {
    try {
      return JSON.parse(await fs.readFile(this.file(slug, collection), 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  // Read-modify-write is serialised per file so two agent results finishing together
  // cannot overwrite each other. Writes go to a temp file first, then rename (atomic on POSIX).
  update(slug, collection, fn) {
    const file = this.file(slug, collection);
    const prev = this.queues.get(file) || Promise.resolve();
    const next = prev.then(async () => {
      let items = await this.read(slug, collection);
      const result = await fn(items);
      if (CAPS[collection] && items.length > CAPS[collection]) items = items.slice(-CAPS[collection]);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(items, null, 2));
      await fs.rename(tmp, file);
      return result;
    });
    this.queues.set(file, next.catch(() => {}));
    return next;
  }

  static nextId(items, collection) {
    const max = items.reduce((m, i) => Math.max(m, parseInt(String(i.id).split('-')[1], 10) || 0), 0);
    return `${PREFIX[collection]}-${String(max + 1).padStart(4, '0')}`;
  }

  insert(slug, collection, record) {
    return this.update(slug, collection, (items) => {
      const row = { ...record, id: Store.nextId(items, collection), createdAt: new Date().toISOString() };
      items.push(row);
      return row;
    });
  }

  insertMany(slug, collection, records) {
    return this.update(slug, collection, (items) => {
      const rows = [];
      for (const record of records) {
        const row = { ...record, id: Store.nextId(items, collection), createdAt: new Date().toISOString() };
        items.push(row);
        rows.push(row);
      }
      return rows;
    });
  }

  // fn receives the row and may mutate it; returns the updated row or null if missing.
  modify(slug, collection, id, fn) {
    return this.update(slug, collection, (items) => {
      const row = items.find((i) => i.id === id);
      if (!row) return null;
      fn(row);
      row.updatedAt = new Date().toISOString();
      return row;
    });
  }
}
