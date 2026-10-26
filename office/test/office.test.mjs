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
  await fs.mkdir(path.join(brandsDir, 'acme', 'data'), { recursive: true });
  await fs.mkdir(path.join(brandsDir, 'acme', 'reports'), { recursive: true });
  const hub = { social: 'Social media content and posts', prospecting: 'Find and qualify prospects' };
  for (const [name, desc] of Object.entries(hub)) {
    await fs.mkdir(path.join(root, '.claude', 'skills', name), { recursive: true });
    await fs.writeFile(path.join(root, '.claude', 'skills', name, 'SKILL.md'), `---\nname: ${name}\ndescription: "${desc}"\n---\n# ${name}\nSteps for ${name}.`);
  }
  // A personal skill as sync-skills.mjs would have copied it, with a reference file.
  const lib = path.join(root, 'skills-library');
  await fs.mkdir(path.join(lib, 'personal', 'acme-carousel', 'references'), { recursive: true });
  await fs.writeFile(path.join(lib, 'personal', 'acme-carousel', 'SKILL.md'), '---\nname: acme-carousel\ndescription: Branded carousel design for Acme\n---\n# Carousel method');
  await fs.writeFile(path.join(lib, 'personal', 'acme-carousel', 'references', 'palette.md'), 'Navy #0A1E3F');
  await fs.writeFile(path.join(lib, 'index.json'), JSON.stringify({ syncedAt: '2026-10-27T00:00:00Z', skills: [
    { id: 'personal/acme-carousel', name: 'acme-carousel', description: 'Branded carousel design for Acme', source: 'personal', path: 'skills-library/personal/acme-carousel', category: 'social' },
  ] }));
  await fs.writeFile(path.join(brandsDir, 'acme', 'brand.md'), '# Brand profile: Acme\n- **Brand name:** Acme\n- **Goal:** TODO\n');
  await fs.writeFile(path.join(brandsDir, 'acme', 'LOG.md'), '# Log\n');
  await fs.writeFile(path.join(brandsDir, 'acme', 'data', 'secret.md'), 'private export');
  await fs.writeFile(path.join(brandsDir, 'acme', 'reports', 'r.html'), '<h1>Report</h1>');
  const runner = opts.runner || new MockRunner();
  const office = await new Office({ brandsDir, root, runner, dailyRunLimit: opts.limit || 50 }).init();
  return { office, runner, brandsDir, root };
}

test('AI Manager turns a request into validated tasks', async () => {
  const { office } = await setup();
  await office.command('acme', 'Plan GST content');
  await office.idle();
  const tasks = await office.store.read('acme', 'tasks');
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].id, 'T-0001');
  assert.equal(tasks[0].skill, 'hub/social');
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

test('skill library: hub + personal skills, search, resolve, content with references', async () => {
  const { office } = await setup();
  const lib = office.skills;
  assert.equal(lib.stats().count, 3);
  assert.equal(lib.resolve('social').id, 'hub/social'); // bare names from older tasks still work
  assert.equal(lib.search('carousel', { brandHint: 'acme' })[0].id, 'personal/acme-carousel');
  const c = await lib.content('personal/acme-carousel');
  assert.match(c.main, /Carousel method/);
  assert.deepEqual(c.resources.map((r) => r.path), ['references/palette.md']);
  assert.equal(await lib.content('../../etc/passwd'), null);
});

test('skill worker edits files in the brand folder; changes can be kept or undone', async () => {
  const { office, brandsDir, runner } = await setup();
  const task = await office.addTask('acme', { task: 'Make a carousel', skill: 'personal/acme-carousel' });
  await office.runSkill('acme', task.id);
  await office.idle();
  const call = runner.calls.find((c) => c.agent === 'Skill Worker');
  assert.equal(call.cwd, path.join(brandsDir, 'acme'));
  assert.match(call.prompt, /Carousel method/);
  assert.match(call.prompt, /Navy #0A1E3F/);
  const run = (await office.store.read('acme', 'runs')).find((r) => r.kind === 'worker');
  assert.equal(run.review, 'Pending review');
  assert.deepEqual(run.changes, [{ path: '04-content/mock-deliverable.md', change: 'created' }, { path: 'LOG.md', change: 'modified' }]);
  assert.equal((await office.store.read('acme', 'tasks'))[0].status, 'Done');

  await office.reviewRun('acme', run.id, { action: 'undo' });
  await assert.rejects(fs.stat(path.join(brandsDir, 'acme', '04-content', 'mock-deliverable.md')));
  assert.equal(await fs.readFile(path.join(brandsDir, 'acme', 'LOG.md'), 'utf8'), '# Log\n');
  await assert.rejects(office.reviewRun('acme', run.id, { action: 'keep' }), { status: 409 });
});

test('undo never overwrites files edited again after the run', async () => {
  const { office, brandsDir } = await setup();
  const task = await office.addTask('acme', { task: 'x', skill: 'hub/social' });
  await office.runSkill('acme', task.id);
  await office.idle();
  const file = path.join(brandsDir, 'acme', '04-content', 'mock-deliverable.md');
  await fs.writeFile(file, 'owner edited this');
  const run = (await office.store.read('acme', 'runs')).find((r) => r.kind === 'worker');
  const res = await office.reviewRun('acme', run.id, { action: 'undo' });
  assert.equal(await fs.readFile(file, 'utf8'), 'owner edited this');
  assert.match(res.undo.conflicts[0], /changed again/);
  await assert.rejects(office.runSkill('acme', (await office.addTask('acme', { task: 'no skill' })).id), /no skill/);
});

test('orchestrator plans with valid skills, waits for approval, then runs steps in order', async () => {
  const { office, brandsDir } = await setup();
  const plan = await office.plan('acme', 'Content sprint for November');
  await office.idle();
  let p = (await office.store.read('acme', 'plans'))[0];
  assert.equal(p.id, plan.id);
  assert.equal(p.status, 'Proposed');
  assert.deepEqual(p.steps.map((s) => s.agent), ['worker', 'research', 'content']); // research step without area dropped
  assert.equal(p.steps[0].skill, 'hub/social');
  assert.equal(p.steps[1].skill, 'hub/prospecting');
  assert.deepEqual(p.steps[2].dependsOn, [1]);
  assert.ok(!(await office.store.read('acme', 'tasks')).length, 'nothing runs before approval');

  await office.updatePlan('acme', p.id, { n: 2, skip: true });
  await office.runPlan('acme', p.id);
  await office.idle();
  p = (await office.store.read('acme', 'plans'))[0];
  assert.equal(p.status, 'Done');
  assert.deepEqual(p.steps.map((s) => s.status), ['Done', 'Skipped', 'Done']);
  assert.ok(await fs.stat(path.join(brandsDir, 'acme', '04-content', 'mock-deliverable.md')));
  const draft = (await office.store.read('acme', 'drafts'))[0];
  assert.equal(draft.status, 'Awaiting approval');
  assert.equal(p.steps[2].draftId, draft.id);
  await assert.rejects(office.runPlan('acme', p.id), { status: 409 });
});

test('a failed plan step stops the plan; resume re-runs only that step', async () => {
  let failWorker = true;
  const runner = new MockRunner();
  const base = runner.run.bind(runner);
  runner.run = async (agent, prompt, opts) => {
    if (agent.label === 'Skill Worker' && failWorker) throw new Error('Timed out after 900s');
    return base(agent, prompt, opts);
  };
  const { office } = await setup({ runner });
  const plan = await office.plan('acme', 'sprint');
  await office.idle();
  await office.runPlan('acme', plan.id);
  await office.idle();
  let p = (await office.store.read('acme', 'plans'))[0];
  assert.equal(p.status, 'Stopped');
  assert.equal(p.steps[0].status, 'Failed');
  assert.equal(p.steps[1].status, 'Planned');
  failWorker = false;
  await office.runPlan('acme', plan.id);
  await office.idle();
  p = (await office.store.read('acme', 'plans'))[0];
  assert.equal(p.status, 'Done');
});
