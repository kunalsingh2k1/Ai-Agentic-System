// End-to-end checks of the office workflow against the mock runner (no AI calls).
// Run: npm test  (from office/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Office, lastSlot } from '../lib/office.mjs';
import { MockRunner } from '../lib/runner.mjs';
import { createServer, toCsv } from '../server.mjs';

async function setup(opts = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'office-test-'));
  const brandsDir = path.join(root, 'brands');
  const skillsDir = path.join(root, 'skills');
  await fs.mkdir(path.join(brandsDir, 'acme', 'data'), { recursive: true });
  await fs.mkdir(path.join(brandsDir, 'acme', 'reports'), { recursive: true });
  for (const s of ['social', 'prospecting']) await fs.mkdir(path.join(skillsDir, s), { recursive: true });
  await fs.writeFile(path.join(brandsDir, 'acme', 'brand.md'), '# Brand profile: Acme\n- **Brand name:** Acme\n- **Goal:** TODO\n');
  await fs.writeFile(path.join(brandsDir, 'acme', 'LOG.md'), '# Log\n');
  await fs.writeFile(path.join(brandsDir, 'acme', 'data', 'secret.md'), 'private export');
  await fs.writeFile(path.join(brandsDir, 'acme', 'reports', 'r.html'), '<h1>Report</h1>');
  const runner = opts.runner || new MockRunner();
  const office = await new Office({ brandsDir, skillsDir, runner, dailyRunLimit: opts.limit || 50 }).init();
  return { office, runner, brandsDir };
}

test('AI Manager turns a request into validated tasks', async () => {
  const { office } = await setup();
  await office.command('acme', 'Plan GST content');
  await office.idle();
  const tasks = await office.store.read('acme', 'tasks');
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].id, 'T-0001');
  assert.equal(tasks[0].skill, 'social');
  assert.equal(tasks[0].status, 'Pending');
  const runs = await office.store.read('acme', 'runs');
  assert.equal(runs[0].status, 'ok');
});

test('draft → quality check → approval saves to the brand folder and closes the task', async () => {
  const { office, brandsDir } = await setup();
  const task = await office.addTask('acme', { task: 'Write a post', priority: 'High' });
  const draft = await office.createDraft('acme', task.id, { platform: 'Instagram' });
  assert.equal(draft.status, 'Generating');
  await office.idle();
  let d = (await office.store.read('acme', 'drafts'))[0];
  assert.equal(d.status, 'Awaiting approval');
  assert.equal(d.qc.decision, 'approve');
  assert.match(d.body, /GST/);

  d = await office.decide('acme', d.id, { action: 'approve' });
  assert.equal(d.status, 'Approved');
  const saved = await fs.readFile(path.join(brandsDir, 'acme', d.savedTo), 'utf8');
  assert.match(saved, /ready to post manually/);
  assert.equal((await office.store.read('acme', 'tasks'))[0].status, 'Done');
  assert.match(await fs.readFile(path.join(brandsDir, 'acme', 'LOG.md'), 'utf8'), /Approved content draft D-0001/);

  await assert.rejects(office.decide('acme', d.id, { action: 'reject' }), { status: 409 });
});

test('revision needs feedback, keeps the old version and re-checks', async () => {
  const { office } = await setup();
  const task = await office.addTask('acme', { task: 'Write a post' });
  const { id } = await office.createDraft('acme', task.id);
  await office.idle();
  await assert.rejects(office.decide('acme', id, { action: 'revise', note: '' }), /what to change/);
  await office.decide('acme', id, { action: 'revise', note: 'Shorter' });
  await office.idle();
  const d = (await office.store.read('acme', 'drafts'))[0];
  assert.equal(d.status, 'Awaiting approval');
  assert.equal(d.versions.length, 1);
  assert.equal(d.history.at(-1).action, 'Revision requested');
});

test('unreadable AI output is retried once, then the draft fails visibly', async () => {
  const bad = { kind: 'mock', calls: 0, available: () => true, async run() { this.calls++; return { text: 'sorry, no json', costUsd: 0 }; } };
  const { office } = await setup({ runner: bad });
  const task = await office.addTask('acme', { task: 'Write a post' });
  await office.createDraft('acme', task.id);
  await office.idle();
  const d = (await office.store.read('acme', 'drafts'))[0];
  assert.equal(bad.calls, 2);
  assert.equal(d.status, 'Failed');
  assert.match(d.error, /No JSON/);
});

test('lead research drops leads without a source, marks the rest for verification, dedupes', async () => {
  const { office } = await setup();
  let r = await office.research('acme', { niche: 'boutiques', area: 'Uttam Nagar' });
  assert.deepEqual(await r.job, { added: 1, duplicates: 0 });
  const [lead] = await office.store.read('acme', 'leads');
  assert.equal(lead.businessName, 'Example Boutique');
  assert.equal(lead.reviewStatus, 'Needs human verification');
  assert.equal(lead.contactStatus, 'Not contacted');
  r = await office.research('acme', { niche: 'boutiques', area: 'Uttam Nagar' });
  assert.deepEqual(await r.job, { added: 0, duplicates: 1 });
  await assert.rejects(office.addLead('acme', { businessName: 'X' }), /source URL/);
});

test('outreach is drafted only for verified leads that may be contacted', async () => {
  const { office } = await setup();
  await (await office.research('acme', { niche: 'b', area: 'a' })).job;
  await assert.rejects(office.outreach('acme', 'L-0001'), /Verify this lead/);
  await office.updateLead('acme', 'L-0001', { reviewStatus: 'Verified', contactStatus: 'Do not contact' });
  await assert.rejects(office.outreach('acme', 'L-0001'), /asked not to be contacted/);
  await office.updateLead('acme', 'L-0001', { contactStatus: 'Not contacted' });
  await office.outreach('acme', 'L-0001');
  await office.idle();
  const d = (await office.store.read('acme', 'drafts'))[0];
  assert.equal(d.kind, 'outreach');
  assert.equal(d.status, 'Awaiting approval');
});

test('daily run limit stops AI calls', async () => {
  const { office } = await setup({ limit: 1 });
  await office.command('acme', 'one');
  await office.idle();
  await assert.rejects(office.command('acme', 'two'), { status: 429 });
});

test('daily report is built from data only', async () => {
  const { office } = await setup();
  await office.addTask('acme', { task: 'Blocked thing' });
  await office.updateTask('acme', 'T-0001', { status: 'Blocked', notes: 'waiting on photos' });
  const rep = await office.report('acme');
  assert.deepEqual(rep.blocked, ['T-0001 Blocked thing (waiting on photos)']);
  await office.report('acme');
  assert.equal((await office.store.read('acme', 'log')).length, 1); // one entry per day
});

test('brand files: no path traversal, private data folder hidden', async () => {
  const { office } = await setup();
  assert.equal(await office.brands.readFile('acme', '../../etc/passwd'), null);
  assert.equal(await office.brands.readFile('acme', 'data/secret.md'), null);
  assert.equal(await office.brands.readFile('acme', '../other-brand/brand.md'), null);
  assert.equal(await office.brands.readFile('acme', '/etc/hosts'), null);
  assert.ok(await office.brands.readFile('acme', 'reports/r.html'));
  const files = (await office.brands.files('acme')).map((f) => f.path);
  assert.ok(!files.some((f) => f.startsWith('data/')));
});

test('routine fires once per scheduled slot', async () => {
  const { office } = await setup();
  const r = await office.addRoutine('acme', { kind: 'report', day: '', hour: 9 });
  // Pretend it was created yesterday so today's 09:00 slot is due.
  await office.store.modify('acme', 'routines', r.id, (x) => { x.createdAt = new Date(Date.now() - 2 * 86400e3).toISOString(); });
  const now = new Date();
  now.setHours(10, 0, 0, 0);
  await office.tick(now);
  await office.tick(now);
  const [routine] = await office.store.read('acme', 'routines');
  assert.equal(routine.lastRunAt, now.toISOString());
  assert.equal((await office.store.read('acme', 'log')).length, 1);
  const slot = lastSlot(new Date('2026-10-28T08:00:00'), 1, 9); // Wednesday 08:00 → Monday 09:00
  assert.equal(slot.getDay(), 1);
});

test('HTTP: CSRF guard, unknown brand, sandboxed reports, CSV formula escaping', async () => {
  const { office } = await setup();
  const server = await createServer({ office, token: '' });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let res = await fetch(`${base}/api/brands/acme/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"task":"x"}' });
    assert.equal(res.status, 403);
    res = await fetch(`${base}/api/brands/acme/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Office': '1' }, body: '{"task":"x"}' });
    assert.equal(res.status, 200);
    res = await fetch(`${base}/api/brands/nope/state`);
    assert.equal(res.status, 404);
    res = await fetch(`${base}/api/brands/acme/file?path=reports/r.html`);
    assert.match(res.headers.get('content-security-policy'), /^sandbox/);
    res = await fetch(`${base}/api/brands/acme/file?path=data/secret.md`);
    assert.equal(res.status, 404);
    res = await fetch(`${base}/`);
    assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  } finally {
    server.close();
  }
  assert.equal(toCsv([{ a: '=HYPERLINK("x")' }]).split('\n')[1], `"'=HYPERLINK(""x"")"`);
});
