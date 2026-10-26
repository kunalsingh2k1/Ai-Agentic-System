// Office core: the AI Digital Office workflow (task intake → draft → quality check → human
// approval; ethical lead research; daily report; routines) on top of the marketing hub's brands.
// HTTP lives in server.mjs; everything here is plain async methods so it can be tested directly.
import { promises as fs } from 'node:fs';
import { Store } from './store.mjs';
import { Brands } from './brands.mjs';
import { buildAgents, normaliseLead, leadKey, InvalidOutput } from './agents.mjs';
import { extractJson } from './runner.mjs';

export const TASK_STATUS = ['Pending', 'In Progress', 'Blocked', 'Done'];
export const REVIEW_STATUS = ['Needs human verification', 'Verified', 'Rejected'];
export const CONTACT_STATUS = ['Not contacted', 'Contacted manually', 'Replied', 'Client', 'Do not contact'];

export class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export class Office {
  constructor({ brandsDir, skillsDir, runner, maxConcurrent = 2, dailyRunLimit = 40 }) {
    this.store = new Store(brandsDir);
    this.brands = new Brands(brandsDir);
    this.skillsDir = skillsDir;
    this.runner = runner;
    this.maxConcurrent = maxConcurrent;
    this.dailyRunLimit = dailyRunLimit;
    this.active = 0;
    this.waiting = [];
    this.runsToday = { date: today(), count: 0 };
    this.pending = new Set(); // background jobs, so tests and shutdown can wait for them
  }

  async init() {
    const skills = await fs.readdir(this.skillsDir).catch(() => []);
    this.agents = buildAgents({ skills: skills.filter((s) => !s.startsWith('.')).sort() });
    return this;
  }

  async requireBrand(slug) {
    if (!(await this.brands.exists(slug))) throw new UserError('Brand not found', 404);
  }

  // ───────────── agent execution ─────────────

  async acquire() {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    await new Promise((resolve) => this.waiting.push(resolve));
    this.active++;
  }

  release() {
    this.active--;
    this.waiting.shift()?.();
  }

  // Cost control: a hard cap on model runs per day (resets at midnight UTC or on restart).
  countRun() {
    if (this.runsToday.date !== today()) this.runsToday = { date: today(), count: 0 };
    if (this.runsToday.count >= this.dailyRunLimit) {
      throw new UserError(`Daily AI run limit reached (${this.dailyRunLimit}). Raise OFFICE_DAILY_RUN_LIMIT or try tomorrow.`, 429);
    }
    this.runsToday.count++;
  }

  async runAgent(slug, name, input, ref = '') {
    const agent = this.agents[name];
    this.countRun();
    const run = await this.store.insert(slug, 'runs', { agent: agent.label, ref, status: 'queued' });
    await this.acquire();
    const started = Date.now();
    try {
      await this.store.modify(slug, 'runs', run.id, (r) => { r.status = 'running'; });
      const ctx = await this.brands.agentContext(slug);
      const prompt = agent.prompt({ ...input, today: today() }, ctx);
      let res = await this.runner.run(agent, prompt);
      let parsed;
      try {
        parsed = agent.validate(extractJson(res.text));
      } catch (e) {
        if (!(e instanceof InvalidOutput)) throw e;
        // The guide's rule: validate, retry once, then hand to a human.
        res = await this.runner.run(agent, `${prompt}\n\nYour previous reply could not be used (${e.message}). Reply again with ONLY the JSON object.`);
        parsed = agent.validate(extractJson(res.text));
      }
      await this.store.modify(slug, 'runs', run.id, (r) => {
        r.status = 'ok';
        r.durationMs = Date.now() - started;
        r.costUsd = res.costUsd;
      });
      return parsed;
    } catch (e) {
      await this.store.modify(slug, 'runs', run.id, (r) => {
        r.status = 'error';
        r.durationMs = Date.now() - started;
        r.error = friendlyError(e);
      });
      throw e;
    } finally {
      this.release();
    }
  }

  background(promise) {
    const p = promise.catch(() => {}).finally(() => this.pending.delete(p));
    this.pending.add(p);
  }

  async idle() {
    while (this.pending.size) await Promise.all([...this.pending]);
  }

  // ───────────── tasks (AI Manager) ─────────────

  async command(slug, request) {
    await this.requireBrand(slug);
    request = String(request || '').trim().slice(0, 2000);
    if (!request) throw new UserError('Write what you need first');
    this.countRunPreview();
    this.background((async () => {
      const { tasks } = await this.runAgent(slug, 'manager', { request }, 'command');
      await this.store.insertMany(slug, 'tasks', tasks.map((t) => ({ ...t, request, status: 'Pending' })));
    })());
    return { accepted: true };
  }

  // Fail fast in the request (rather than silently in the background) when the cap is hit.
  countRunPreview() {
    if (this.runsToday.date === today() && this.runsToday.count >= this.dailyRunLimit) this.countRun();
  }

  async addTask(slug, body) {
    await this.requireBrand(slug);
    const task = String(body.task || '').trim().slice(0, 300);
    if (!task) throw new UserError('Task text is required');
    return this.store.insert(slug, 'tasks', {
      task, request: 'Added manually', status: 'Pending', notes: String(body.notes || '').slice(0, 500),
      priority: ['High', 'Medium', 'Low'].includes(body.priority) ? body.priority : 'Medium',
      owner: body.owner || 'You', deadline: /^\d{4}-\d{2}-\d{2}$/.test(body.deadline) ? body.deadline : '', skill: '',
    });
  }

  async updateTask(slug, id, body) {
    await this.requireBrand(slug);
    if (body.status && !TASK_STATUS.includes(body.status)) throw new UserError('Unknown status');
    const row = await this.store.modify(slug, 'tasks', id, (t) => {
      if (body.status) t.status = body.status;
      if (['High', 'Medium', 'Low'].includes(body.priority)) t.priority = body.priority;
      if (typeof body.notes === 'string') t.notes = body.notes.slice(0, 500);
      if (body.deadline === '' || /^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) t.deadline = body.deadline;
    });
    if (!row) throw new UserError('Task not found', 404);
    return row;
  }

  // ───────────── drafts + approval gate ─────────────

  async createDraft(slug, taskId, { platform = '', instructions = '' } = {}) {
    await this.requireBrand(slug);
    const task = (await this.store.read(slug, 'tasks')).find((t) => t.id === taskId);
    if (!task) throw new UserError('Task not found', 404);
    this.countRunPreview();
    const draft = await this.store.insert(slug, 'drafts', {
      kind: 'content', taskId, title: task.task, platform: String(platform).slice(0, 60),
      instructions: String(instructions).slice(0, 1000), status: 'Generating', body: '', versions: [],
      history: [{ at: new Date().toISOString(), action: 'Draft requested' }],
    });
    await this.store.modify(slug, 'tasks', taskId, (t) => { if (t.status === 'Pending') t.status = 'In Progress'; });
    this.background(this.generate(slug, draft.id, { task: task.task, platform, instructions }));
    return draft;
  }

  async outreach(slug, leadId, { purpose = 'first', instructions = '' } = {}) {
    await this.requireBrand(slug);
    const lead = (await this.store.read(slug, 'leads')).find((l) => l.id === leadId);
    if (!lead) throw new UserError('Lead not found', 404);
    if (lead.reviewStatus !== 'Verified') throw new UserError('Verify this lead before drafting outreach');
    if (lead.contactStatus === 'Do not contact') throw new UserError('This business asked not to be contacted');
    this.countRunPreview();
    const draft = await this.store.insert(slug, 'drafts', {
      kind: 'outreach', leadId, title: `Message to ${lead.businessName}`, platform: 'WhatsApp',
      status: 'Generating', body: '', versions: [], history: [{ at: new Date().toISOString(), action: 'Outreach draft requested' }],
    });
    this.background(this.generate(slug, draft.id, { lead, purpose, instructions }, 'followup'));
    return draft;
  }

  // Draft → quality check → "Awaiting approval". Any failure leaves a visible "Failed" draft.
  async generate(slug, draftId, input, agentName = 'content') {
    try {
      const out = await this.runAgent(slug, agentName, input, draftId);
      await this.store.modify(slug, 'drafts', draftId, (d) => {
        d.body = out.body;
        d.title = out.title || d.title;
        d.platform = out.platform || d.platform;
        d.visual = out.visual || '';
        d.unsure = out.unsure;
      });
      await this.check(slug, draftId);
    } catch (e) {
      await this.store.modify(slug, 'drafts', draftId, (d) => {
        d.status = 'Failed';
        d.error = friendlyError(e);
      });
    }
  }

  async check(slug, draftId) {
    const d = (await this.store.read(slug, 'drafts')).find((x) => x.id === draftId);
    let qc;
    try {
      qc = await this.runAgent(slug, 'qc', { draft: d.body, platform: d.platform, kind: d.kind }, draftId);
    } catch (e) {
      qc = { decision: 'unchecked', issues: [`Quality check could not run: ${friendlyError(e)}`], suggested_revision: '' };
    }
    await this.store.modify(slug, 'drafts', draftId, (x) => {
      x.qc = qc;
      x.status = 'Awaiting approval';
    });
  }

  async decide(slug, id, { action, note = '' }) {
    await this.requireBrand(slug);
    note = String(note).trim().slice(0, 1000);
    const draft = (await this.store.read(slug, 'drafts')).find((d) => d.id === id);
    if (!draft) throw new UserError('Draft not found', 404);
    const open = draft.status === 'Awaiting approval' || (draft.status === 'Failed' && action !== 'approve');
    if (!open) throw new UserError(`This draft is "${draft.status}" and can't be changed now`, 409);
    const stamp = (d, label) => d.history.push({ at: new Date().toISOString(), action: label, note });

    if (action === 'approve') {
      const savedTo = await this.brands.saveApproved(slug, draft);
      const row = await this.store.modify(slug, 'drafts', id, (d) => {
        d.status = 'Approved';
        d.decidedAt = new Date().toISOString();
        d.savedTo = savedTo;
        stamp(d, 'Approved');
      });
      if (draft.taskId) await this.store.modify(slug, 'tasks', draft.taskId, (t) => { t.status = 'Done'; });
      await this.brands.appendLog(slug, `${savedTo} · Approved ${draft.kind} draft ${id}: ${draft.title}`);
      return row;
    }
    if (action === 'reject') {
      return this.store.modify(slug, 'drafts', id, (d) => {
        d.status = 'Rejected';
        d.decidedAt = new Date().toISOString();
        stamp(d, 'Rejected');
      });
    }
    if (action === 'revise' || action === 'apply_suggestion') {
      if (action === 'revise' && !note) throw new UserError('Say what to change');
      if (action === 'apply_suggestion' && !draft.qc?.suggested_revision) throw new UserError('No suggestion to apply');
      this.countRunPreview();
      const row = await this.store.modify(slug, 'drafts', id, (d) => {
        d.versions.push({ at: new Date().toISOString(), body: d.body, qc: d.qc });
        d.status = 'Generating';
        d.error = undefined;
        stamp(d, action === 'revise' ? 'Revision requested' : 'Applied quality-check suggestion');
        if (action === 'apply_suggestion') d.body = d.qc.suggested_revision;
      });
      if (action === 'apply_suggestion') {
        this.background(this.check(slug, id));
      } else if (draft.kind === 'outreach') {
        const lead = (await this.store.read(slug, 'leads')).find((l) => l.id === draft.leadId);
        this.background(this.generate(slug, id, { lead, instructions: `Rewrite of: ${draft.body}\nChange: ${note}` }, 'followup'));
      } else {
        const task = (await this.store.read(slug, 'tasks')).find((t) => t.id === draft.taskId);
        this.background(this.generate(slug, id, { task: task?.task || draft.title, platform: draft.platform, instructions: draft.instructions, previous: draft.body, feedback: note }));
      }
      return row;
    }
    throw new UserError('Unknown action');
  }

  // ───────────── leads (ethical research) ─────────────

  async research(slug, { niche, area, count = 10 }, ref = 'research') {
    await this.requireBrand(slug);
    niche = String(niche || '').trim().slice(0, 120);
    area = String(area || '').trim().slice(0, 120);
    if (!niche || !area) throw new UserError('Give a niche and an area');
    count = Math.min(Math.max(parseInt(count, 10) || 10, 1), 15);
    this.countRunPreview();
    const job = (async () => {
      const { leads } = await this.runAgent(slug, 'research', { niche, area, count }, ref);
      return this.addLeads(slug, leads, 'Research Agent');
    })();
    this.background(job);
    return { accepted: true, job };
  }

  async addLeads(slug, leads, origin) {
    return this.store.update(slug, 'leads', (items) => {
      const seen = new Set(items.map(leadKey));
      const added = [];
      for (const l of leads) {
        const key = leadKey(l);
        if (seen.has(key)) continue;
        seen.add(key);
        const row = { ...l, origin, reviewStatus: 'Needs human verification', contactStatus: 'Not contacted', nextAction: '',
          id: Store.nextId(items, 'leads'), createdAt: new Date().toISOString() };
        items.push(row);
        added.push(row);
      }
      return { added: added.length, duplicates: leads.length - added.length };
    });
  }

  async addLead(slug, body) {
    await this.requireBrand(slug);
    const lead = normaliseLead(body);
    if (!lead) throw new UserError('A lead needs a business name and the public source URL where you found it');
    const res = await this.addLeads(slug, [lead], 'Added manually');
    if (!res.added) throw new UserError('This business is already in your leads', 409);
    return res;
  }

  async updateLead(slug, id, body) {
    await this.requireBrand(slug);
    if (body.reviewStatus && !REVIEW_STATUS.includes(body.reviewStatus)) throw new UserError('Unknown review status');
    if (body.contactStatus && !CONTACT_STATUS.includes(body.contactStatus)) throw new UserError('Unknown contact status');
    const row = await this.store.modify(slug, 'leads', id, (l) => {
      if (body.reviewStatus) l.reviewStatus = body.reviewStatus;
      if (body.contactStatus) l.contactStatus = body.contactStatus;
      if (typeof body.nextAction === 'string') l.nextAction = body.nextAction.slice(0, 300);
      if (typeof body.publicContact === 'string') l.publicContact = body.publicContact.slice(0, 120);
    });
    if (!row) throw new UserError('Lead not found', 404);
    return row;
  }

  // ───────────── daily report (deterministic: it can't invent progress) ─────────────

  async report(slug) {
    await this.requireBrand(slug);
    const [tasks, drafts, leads] = await Promise.all(['tasks', 'drafts', 'leads'].map((c) => this.store.read(slug, c)));
    const d = today();
    const by = (s) => tasks.filter((t) => t.status === s);
    const rank = { High: 0, Medium: 1, Low: 2 };
    const open = tasks.filter((t) => t.status !== 'Done')
      .sort((a, b) => rank[a.priority] - rank[b.priority] || (a.deadline || '9').localeCompare(b.deadline || '9'));
    const report = {
      date: d,
      completedToday: by('Done').filter((t) => (t.updatedAt || '').startsWith(d)).map((t) => `${t.id} ${t.task}`),
      pending: by('Pending').length,
      inProgress: by('In Progress').length,
      blocked: by('Blocked').map((t) => `${t.id} ${t.task}${t.notes ? ` (${t.notes})` : ''}`),
      awaitingApproval: drafts.filter((x) => x.status === 'Awaiting approval').map((x) => `${x.id} ${x.title}`),
      failedDrafts: drafts.filter((x) => x.status === 'Failed').length,
      leadsToVerify: leads.filter((l) => l.reviewStatus === 'Needs human verification').length,
      verifiedNotContacted: leads.filter((l) => l.reviewStatus === 'Verified' && l.contactStatus === 'Not contacted').length,
      overdue: open.filter((t) => t.deadline && t.deadline < d).map((t) => `${t.id} ${t.task} (due ${t.deadline})`),
      priorities: open.slice(0, 3).map((t) => `${t.id} ${t.task}`),
    };
    await this.store.update(slug, 'log', (items) => {
      const i = items.findIndex((x) => x.date === d);
      const row = { ...report, id: i >= 0 ? items[i].id : Store.nextId(items, 'log'), createdAt: new Date().toISOString() };
      if (i >= 0) items[i] = row;
      else items.push(row);
    });
    return report;
  }

  // ───────────── routines (scheduled runs, e.g. weekly lead research) ─────────────

  async addRoutine(slug, body) {
    await this.requireBrand(slug);
    const kind = ['research', 'report'].includes(body.kind) ? body.kind : null;
    if (!kind) throw new UserError('Routine must be "research" or "report"');
    const day = body.day === '' || body.day == null ? null : Number(body.day);
    const hour = Number(body.hour);
    if (day !== null && !(day >= 0 && day <= 6)) throw new UserError('Day must be 0-6 (Sunday-Saturday) or empty for daily');
    if (!(hour >= 0 && hour <= 23)) throw new UserError('Hour must be 0-23');
    const input = kind === 'research' ? { niche: String(body.niche || '').slice(0, 120), area: String(body.area || '').slice(0, 120), count: Math.min(parseInt(body.count, 10) || 10, 15) } : {};
    if (kind === 'research' && (!input.niche || !input.area)) throw new UserError('Give a niche and an area');
    return this.store.insert(slug, 'routines', { kind, input, day, hour, enabled: true, lastRunAt: null });
  }

  async updateRoutine(slug, id, body) {
    await this.requireBrand(slug);
    if (body.delete) {
      return this.store.update(slug, 'routines', (items) => {
        const i = items.findIndex((r) => r.id === id);
        if (i >= 0) items.splice(i, 1);
        return { deleted: i >= 0 };
      });
    }
    const row = await this.store.modify(slug, 'routines', id, (r) => { r.enabled = Boolean(body.enabled); });
    if (!row) throw new UserError('Routine not found', 404);
    return row;
  }

  // Called every minute by the server. A routine runs once per scheduled slot (local server time).
  async tick(now = new Date()) {
    for (const { slug } of await this.brands.list()) {
      for (const r of await this.store.read(slug, 'routines')) {
        if (!r.enabled) continue;
        const slot = lastSlot(now, r.day, r.hour);
        if (r.lastRunAt && new Date(r.lastRunAt) >= slot) continue;
        if (!r.lastRunAt && new Date(r.createdAt) > slot) continue; // don't fire for a slot before it existed
        await this.store.modify(slug, 'routines', r.id, (x) => { x.lastRunAt = now.toISOString(); });
        if (r.kind === 'report') await this.report(slug);
        else await this.research(slug, r.input, `routine ${r.id}`).catch(() => {});
      }
    }
  }

  async state(slug) {
    await this.requireBrand(slug);
    const [tasks, drafts, leads, runs, routines, log] = await Promise.all(
      ['tasks', 'drafts', 'leads', 'runs', 'routines', 'log'].map((c) => this.store.read(slug, c)));
    return { tasks, drafts, leads, runs: runs.slice(-40).reverse(), routines, log: log.slice(-14).reverse(),
      busy: runs.some((r) => r.status === 'queued' || r.status === 'running') };
  }
}

// Most recent moment matching (day-of-week, hour); day null = every day.
export function lastSlot(now, day, hour) {
  const s = new Date(now);
  s.setMinutes(0, 0, 0);
  s.setHours(hour);
  if (s > now) s.setDate(s.getDate() - 1);
  if (day !== null && day !== undefined) {
    while (s.getDay() !== day) s.setDate(s.getDate() - 1);
  }
  return s;
}

// Plain-language errors for the UI: no stack traces.
function friendlyError(e) {
  const m = String(e?.message || e);
  if (/Timed out/.test(m)) return `${m}. Try a smaller request.`;
  if (/ENOENT|spawn/.test(m)) return 'Claude CLI not found. Set CLAUDE_BIN or install Claude Code.';
  if (/limit/i.test(m)) return m;
  return m.slice(0, 300);
}
