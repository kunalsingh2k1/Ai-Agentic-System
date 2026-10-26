// AI Marketing Office: HTTP API + UI. Zero dependencies (node:http only).
// Start: node office/server.mjs   (env: PORT, HOST, OFFICE_RUNNER=mock|claude, OFFICE_TOKEN,
// OFFICE_DAILY_RUN_LIMIT, OFFICE_MODEL, CLAUDE_BIN). See office/README.md.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Office, UserError } from './lib/office.mjs';
import { ClaudeRunner, MockRunner } from './lib/runner.mjs';
import { SLUG_RE } from './lib/brands.mjs';
import { sync as syncSkills } from './scripts/sync-skills.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC = path.join(HERE, 'public');
const STATIC = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/app.css': ['app.css', 'text/css'] };
const MAX_BODY = 100_000;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};
const UI_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; base-uri 'none'; form-action 'none'";
// Brand HTML reports are rendered sandboxed: no scripts, no network.
const REPORT_CSP = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:";

export async function createServer({ office, token = process.env.OFFICE_TOKEN || '' }) {
  const send = (res, status, body, headers = {}) => {
    const isText = typeof body === 'string';
    res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': isText ? 'text/plain; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(isText ? body : JSON.stringify(body));
  };

  const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new UserError('Request too large', 413));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new UserError('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });

  // [method, pattern, handler(params, body, query)] — first match wins.
  const routes = [
    ['GET', /^\/api\/health$/, async () => ({ runner: office.runner.kind, ready: office.runner.available(), runsToday: office.runsToday.count, dailyRunLimit: office.dailyRunLimit })],
    ['GET', /^\/api\/brands$/, async () => ({ brands: await office.brands.list(), active: await office.brands.active() })],
    ['GET', /^\/api\/brands\/([^/]+)$/, async ([s]) => {
      await office.requireBrand(s);
      return { ...(await office.brands.summary(s)), profile: await office.brands.profile(s), files: await office.brands.files(s) };
    }],
    ['GET', /^\/api\/brands\/([^/]+)\/state$/, async ([s]) => office.state(s)],
    ['POST', /^\/api\/brands\/([^/]+)\/command$/, async ([s], b) => office.command(s, b.request)],
    ['POST', /^\/api\/brands\/([^/]+)\/tasks$/, async ([s], b) => office.addTask(s, b)],
    ['PATCH', /^\/api\/brands\/([^/]+)\/tasks\/(T-\d+)$/, async ([s, id], b) => office.updateTask(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/tasks\/(T-\d+)\/draft$/, async ([s, id], b) => office.createDraft(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/drafts\/(D-\d+)\/decision$/, async ([s, id], b) => office.decide(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/leads$/, async ([s], b) => office.addLead(s, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/leads\/research$/, async ([s], b) => {
      await office.research(s, b);
      return { accepted: true };
    }],
    ['PATCH', /^\/api\/brands\/([^/]+)\/leads\/(L-\d+)$/, async ([s, id], b) => office.updateLead(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/leads\/(L-\d+)\/outreach$/, async ([s, id], b) => office.outreach(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/report$/, async ([s]) => office.report(s)],
    ['POST', /^\/api\/brands\/([^/]+)\/routines$/, async ([s], b) => office.addRoutine(s, b)],
    ['PATCH', /^\/api\/brands\/([^/]+)\/routines\/(W-\d+)$/, async ([s, id], b) => office.updateRoutine(s, id, b)],
    // Skills library
    ['GET', /^\/api\/skills$/, async (_, __, q) => ({
      stats: office.skills.stats(),
      skills: office.skills.search(q.get('q') || '', { limit: Math.min(parseInt(q.get('limit'), 10) || 60, 200), source: q.get('source') || '', category: q.get('category') || '' }),
    })],
    ['GET', /^\/api\/skill$/, async (_, __, q) => {
      const c = await office.skills.content(q.get('id') || '');
      if (!c) throw new UserError('Skill not found', 404);
      return { ...c, resources: c.resources.map((r) => r.path) };
    }],
    ['POST', /^\/api\/skills\/sync$/, async () => {
      const r = await syncSkills({ log: () => {} });
      await office.skills.load();
      return { ...r, stats: office.skills.stats() };
    }],
    // Skill workers (edit files) and their review
    ['POST', /^\/api\/brands\/([^/]+)\/tasks\/(T-\d+)\/run$/, async ([s, id], b) => office.runSkill(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/skills\/run$/, async ([s], b) => office.runSkillDirect(s, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/runs\/(R-\d+)\/review$/, async ([s, id], b) => office.reviewRun(s, id, b)],
    // Orchestrator
    ['POST', /^\/api\/brands\/([^/]+)\/plans$/, async ([s], b) => office.plan(s, b.goal)],
    ['PATCH', /^\/api\/brands\/([^/]+)\/plans\/(P-\d+)$/, async ([s, id], b) => office.updatePlan(s, id, b)],
    ['POST', /^\/api\/brands\/([^/]+)\/plans\/(P-\d+)\/run$/, async ([s, id]) => office.runPlan(s, id)],
    ['POST', /^\/api\/brands\/([^/]+)\/plans\/(P-\d+)\/cancel$/, async ([s, id]) => office.cancelPlan(s, id)],
  ];

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    try {
      if (req.method === 'GET' && STATIC[url.pathname]) {
        const [file, type] = STATIC[url.pathname];
        return send(res, 200, await fs.readFile(path.join(PUBLIC, file), 'utf8'), { 'Content-Type': `${type}; charset=utf-8`, 'Content-Security-Policy': UI_CSP });
      }
      if (!url.pathname.startsWith('/api/')) return send(res, 404, 'Not found');

      // The report viewer is an <iframe>, which can't send headers, so /file also accepts ?token=.
      const fileToken = url.pathname.endsWith('/file') && url.searchParams.get('token') === token;
      if (token && req.headers['x-office-token'] !== token && !fileToken) return send(res, 401, { error: 'Enter the office access token' });
      if (req.method !== 'GET') {
        // Custom header + JSON content type: a cross-site page can't send these without a CORS
        // preflight, and this server never answers preflights, so CSRF requests are refused.
        if (req.headers['x-office'] !== '1' || !String(req.headers['content-type'] || '').startsWith('application/json')) {
          return send(res, 403, { error: 'Request refused' });
        }
      }

      const slug = url.pathname.match(/^\/api\/brands\/([^/]+)/)?.[1];
      if (slug && !SLUG_RE.test(slug)) return send(res, 404, { error: 'Brand not found' });

      // Brand deliverables (md/csv as text, html sandboxed) and CSV exports for Google Sheets.
      let m;
      if (req.method === 'GET' && (m = url.pathname.match(/^\/api\/brands\/([^/]+)\/file$/))) {
        await office.requireBrand(m[1]);
        const f = await office.brands.readFile(m[1], url.searchParams.get('path'));
        if (!f) return send(res, 404, { error: 'File not found' });
        if (f.ext === '.html') return send(res, 200, f.content, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': REPORT_CSP, 'X-Frame-Options': 'SAMEORIGIN' });
        return send(res, 200, f.content);
      }
      if (req.method === 'GET' && (m = url.pathname.match(/^\/api\/brands\/([^/]+)\/export\/(tasks|drafts|leads|log)\.csv$/))) {
        await office.requireBrand(m[1]);
        return send(res, 200, toCsv(await office.store.read(m[1], m[2])), {
          'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${m[1]}-${m[2]}.csv"` });
      }

      for (const [method, re, handler] of routes) {
        if (req.method !== method) continue;
        const match = url.pathname.match(re);
        if (!match) continue;
        const body = method === 'GET' ? {} : await readBody(req);
        return send(res, 200, await handler(match.slice(1), body, url.searchParams));
      }
      return send(res, 404, { error: 'Not found' });
    } catch (e) {
      if (e instanceof UserError) return send(res, e.status, { error: e.message });
      console.error(e);
      return send(res, 500, { error: 'Something went wrong on the office server. Check the terminal for details.' });
    }
  });
  return server;
}

// Flattens rows for spreadsheet import; nested values become JSON text.
export function toCsv(rows) {
  const skip = new Set(['versions', 'history']);
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((c) => !skip.has(c));
  const cell = (v) => {
    let s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runner = process.env.OFFICE_RUNNER === 'mock' ? new MockRunner() : new ClaudeRunner();
  if (process.env.ANTHROPIC_API_KEY) console.warn('Note: ANTHROPIC_API_KEY is set, so Claude runs may bill that API key instead of your Claude plan.');
  if (!runner.available()) console.warn('Claude CLI not found. Agents will fail until you set CLAUDE_BIN or run with OFFICE_RUNNER=mock.');
  const office = await new Office({
    brandsDir: path.join(ROOT, 'brands'),
    root: ROOT,
    runner,
    dailyRunLimit: parseInt(process.env.OFFICE_DAILY_RUN_LIMIT, 10) || 40,
  }).init();
  const server = await createServer({ office });
  const host = process.env.HOST || '127.0.0.1';
  const port = parseInt(process.env.PORT, 10) || 4317;
  server.listen(port, host, () => console.log(`AI Marketing Office on http://${host}:${port} (runner: ${runner.kind}, ${office.skills.stats().count} skills)`));
  const timer = setInterval(() => office.tick().catch((e) => console.error('Routine tick failed:', e.message)), 60_000);
  const stop = () => {
    clearInterval(timer);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
