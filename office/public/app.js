'use strict';
// AI Marketing Office UI. Plain DOM, no framework. Every piece of AI or brand text is inserted as
// text (never as HTML) except Markdown, which is HTML-escaped before formatting.

const S = { brands: [], slug: '', brand: null, state: null, health: null, page: 'today', stateKey: '', approvalsFilter: 'Awaiting approval', leadFilter: 'all', file: null, token: '' };
try { S.token = localStorage.getItem('office-token') || ''; } catch { /* storage blocked */ }

const $ = (sel) => document.querySelector(sel);
const main = $('#main');

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : String(kid));
  }
  return el;
}

function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = isError ? 'toast err' : 'toast';
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, isError ? 6000 : 3000);
}

async function api(method, url, body) {
  const headers = {};
  if (S.token) headers['X-Office-Token'] = S.token;
  if (method !== 'GET') {
    headers['X-Office'] = '1';
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
  if (res.status === 401) {
    const t = window.prompt('Enter the office access token (OFFICE_TOKEN):');
    if (t) {
      S.token = t.trim();
      try { localStorage.setItem('office-token', S.token); } catch { /* ignore */ }
      return api(method, url, body);
    }
    throw new Error('Access token needed');
  }
  const data = (res.headers.get('content-type') || '').includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

// Runs an action, shows a toast, refreshes state. Errors are shown in plain words.
async function act(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg);
    await refresh(true);
    return r;
  } catch (e) {
    toast(e.message, true);
    return null;
  }
}

const B = (path) => `/api/brands/${S.slug}${path}`;
const copy = (text) => navigator.clipboard.writeText(text).then(() => toast('Copied'), () => toast('Copy failed: select the text and copy it manually', true));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
const extLink = (url, label) => (safeUrl(url) ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, label || url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)) : '');

const statusTag = (s) => {
  const cls = { 'Awaiting approval': 'warn', Approved: 'good', Done: 'good', Verified: 'good', Client: 'good', Rejected: 'bad', Failed: 'bad', Blocked: 'bad', 'Do not contact': 'bad', ok: 'good', error: 'bad', running: '', queued: 'muted', Generating: '' }[s];
  return h('span', { class: `tag ${cls ?? 'muted'}` }, s === 'Generating' || s === 'running' ? [h('span', { class: 'spin' }), ' '] : null, s);
};

// ───────────── Markdown (escape first, then format) ─────────────
function md(src) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = String(src).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const code = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
    } else if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      const [head, ...rest] = body;
      out.push(`<div class="tbl"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    } else if (/^#{1,4}\s/.test(l)) {
      const n = Math.min(l.match(/^#+/)[0].length, 4);
      out.push(`<h${n}>${inline(l.replace(/^#+\s*/, ''))}</h${n}>`);
    } else if (/^\s*([-*]|\d+\.)\s/.test(l)) {
      const items = [];
      const ordered = /^\s*\d+\./.test(l);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s/, ''));
      i--;
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (/^>\s?/.test(l)) {
      out.push(`<blockquote>${inline(l.replace(/^>\s?/, ''))}</blockquote>`);
    } else if (l.trim()) {
      out.push(`<p>${inline(l)}</p>`);
    }
  }
  const div = h('div', { class: 'md' });
  div.innerHTML = out.join('\n');
  return div;
}

// ───────────── pages ─────────────
const nextHub = { Onboarded: 'hub-report', Reported: 'hub-strategy', Strategy: 'hub-content', Content: 'hub-grow', Growing: 'hub-grow' };

function pageToday() {
  const st = S.state;
  const b = S.brand;
  const awaiting = st.drafts.filter((d) => d.status === 'Awaiting approval').length;
  const open = st.tasks.filter((t) => t.status !== 'Done').length;
  const verify = st.leads.filter((l) => l.reviewStatus === 'Needs human verification').length;
  const generating = st.drafts.filter((d) => d.status === 'Generating').length + st.runs.filter((r) => r.status === 'running' || r.status === 'queued').length;
  const rep = st.log[0];
  const cmd = `/${nextHub[b.stage] || 'hub-status'} ${S.slug}`;
  const list = (title, items) => h('div', {}, h('h3', {}, title), items.length ? h('ul', {}, items.map((x) => h('li', {}, x))) : h('p', { class: 'note' }, 'None'));
  return h('div', {},
    h('h1', {}, b.name),
    h('p', { class: 'sub' }, `Stage: ${b.stage} · Profile ${b.completeness}% complete`, b.lastActivity ? ` · Last: ${b.lastActivity.split(' · ').slice(1, 2).join('')}` : ''),
    h('div', { class: 'grid tiles' },
      h('a', { class: 'tile', href: '#/approvals' }, h('div', { class: 'n' }, awaiting), h('div', { class: 'l' }, 'Drafts awaiting your approval')),
      h('a', { class: 'tile', href: '#/tasks' }, h('div', { class: 'n' }, open), h('div', { class: 'l' }, 'Open tasks')),
      h('a', { class: 'tile', href: '#/leads' }, h('div', { class: 'n' }, verify), h('div', { class: 'l' }, 'Leads to verify')),
      h('a', { class: 'tile', href: '#/activity' }, h('div', { class: 'n' }, generating), h('div', { class: 'l' }, 'AI jobs running')),
      h('div', { class: 'tile' }, h('div', { class: 'n' }, `${S.health?.runsToday ?? 0}/${S.health?.dailyRunLimit ?? '–'}`), h('div', { class: 'l' }, 'AI runs used today'))),
    h('div', { class: 'grid two', style: 'margin-top:16px' },
      h('section', { class: 'panel' },
        h('div', { class: 'row spread' }, h('h2', {}, rep ? `Daily report · ${rep.date}` : 'Daily report'),
          h('button', { class: 'btn sm', onclick: () => act(() => api('POST', B('/report')), 'Report updated') }, rep ? 'Refresh' : 'Create')),
        rep ? h('div', { class: 'grid' },
          list('Top 3 priorities', rep.priorities),
          list('Awaiting approval', rep.awaitingApproval),
          list('Blocked', rep.blocked),
          list('Overdue', rep.overdue || []),
          h('p', { class: 'note' }, `Completed today: ${rep.completedToday.length} · Pending: ${rep.pending} · In progress: ${rep.inProgress} · Leads to verify: ${rep.leadsToVerify} · Verified, not yet contacted: ${rep.verifiedNotContacted}`))
          : h('p', { class: 'empty' }, 'No report yet. It is built from your tasks, drafts and leads, so it never invents progress.')),
      h('section', { class: 'panel' },
        h('h2', {}, 'Next step in the hub'),
        h('p', {}, 'Deep work (reports, strategy, content calendars) runs in the Claude Code chat. Paste this command there:'),
        h('div', { class: 'row' }, h('code', { class: 'draft-body', style: 'margin:0;flex:1' }, cmd), h('button', { class: 'btn primary', onclick: () => copy(cmd) }, 'Copy')),
        h('p', { class: 'note', style: 'margin-top:12px' }, 'Daily routine from the guide: morning, review priorities and approve drafts → midday, verify new leads → evening, refresh the report.'))));
}

function pageCommand() {
  const ta = h('textarea', { id: 'cmd', placeholder: 'e.g. Plan 4 Instagram carousels this week about GST due dates, in Hinglish', maxlength: 2000 });
  const examples = [
    'Plan this week\'s Instagram carousels about GST and ITR deadlines',
    'Find boutiques and retail shops in Uttam Nagar that may need GST help',
    'Draft a WhatsApp message asking existing clients for a Google review',
    'Plan a campaign for the 31 December belated ITR deadline',
  ];
  const submit = () => act(async () => {
    await api('POST', B('/command'), { request: ta.value });
    ta.value = '';
  }, 'The Manager is planning your tasks…');
  const recent = S.state.tasks.slice(-8).reverse();
  return h('div', {},
    h('h1', {}, 'Ask the Manager'),
    h('p', { class: 'sub' }, 'Describe what you need. The AI Manager turns it into 1–5 tasks and assigns them to the Content, Research or Follow-up agent, or to you. Nothing is posted or sent.'),
    h('section', { class: 'panel' }, ta,
      h('div', { class: 'row spread', style: 'margin-top:10px' },
        h('div', { class: 'row' }, examples.map((x) => h('span', { class: 'chip', onclick: () => { ta.value = x; ta.focus(); } }, x))),
        h('button', { class: 'btn primary', onclick: submit }, 'Plan tasks'))),
    h('h2', {}, 'Latest tasks'),
    recent.length ? recent.map(taskCard) : h('p', { class: 'empty' }, 'No tasks yet.'));
}

function taskCard(t) {
  const draftForm = h('div', { hidden: true, style: 'margin-top:8px' },
    h('div', { class: 'row' },
      h('select', { 'data-platform': '' }, ['Instagram', 'Instagram carousel', 'Instagram Reel script', 'Facebook', 'LinkedIn', 'WhatsApp broadcast', 'Google Business Profile post', 'Email', 'Blog / website'].map((p) => h('option', {}, p))),
      h('input', { placeholder: 'Extra instructions (optional)', 'data-instr': '', style: 'flex:1;min-width:140px' }),
      h('button', { class: 'btn primary sm', onclick: (e) => {
        const box = e.target.closest('div');
        act(() => api('POST', B(`/tasks/${t.id}/draft`), { platform: box.querySelector('[data-platform]').value, instructions: box.querySelector('[data-instr]').value }), 'Drafting… it will appear in Approvals');
      } }, 'Create draft')));
  return h('div', { class: 'card' },
    h('div', { class: 't' }, t.task),
    h('div', { class: 'row' },
      h('span', { class: `tag ${t.priority === 'High' ? 'bad' : t.priority === 'Medium' ? 'warn' : 'muted'}` }, t.priority),
      h('span', { class: 'tag muted' }, t.owner),
      t.skill ? h('span', { class: 'tag' }, `/${t.skill}`) : null,
      t.deadline ? h('span', { class: 'meta' }, `Due ${t.deadline}`) : null,
      h('span', { class: 'meta' }, t.id)),
    t.notes ? h('div', { class: 'meta', style: 'margin-top:6px' }, t.notes) : null,
    h('div', { class: 'row', style: 'margin-top:8px' },
      h('select', { 'aria-label': 'Status', onchange: (e) => act(() => api('PATCH', B(`/tasks/${t.id}`), { status: e.target.value })) },
        ['Pending', 'In Progress', 'Blocked', 'Done'].map((s) => h('option', { selected: s === t.status }, s))),
      t.status !== 'Done' && t.owner !== 'Research Agent' ? h('button', { class: 'btn sm', onclick: () => { draftForm.hidden = !draftForm.hidden; } }, 'Draft with AI') : null,
      t.owner === 'Research Agent' && t.status !== 'Done' ? h('a', { class: 'btn sm', href: '#/leads' }, 'Research leads') : null),
    draftForm);
}

function pageTasks() {
  const cols = ['Pending', 'In Progress', 'Blocked', 'Done'];
  const input = h('input', { placeholder: 'Add a task yourself', style: 'flex:1;min-width:200px', maxlength: 300 });
  const pri = h('select', {}, ['High', 'Medium', 'Low'].map((p) => h('option', { selected: p === 'Medium' }, p)));
  return h('div', {},
    h('div', { class: 'row spread' }, h('h1', {}, 'Tasks'), h('button', { class: 'btn sm', onclick: () => download('tasks') }, 'Export CSV')),
    h('p', { class: 'sub' }, 'Every task the Manager created, plus your own. Change the status as work moves.'),
    h('div', { class: 'panel row' }, input, pri,
      h('button', { class: 'btn primary', onclick: () => act(() => api('POST', B('/tasks'), { task: input.value, priority: pri.value }), 'Task added') }, 'Add')),
    h('div', { class: 'board' }, cols.map((c) => {
      const items = S.state.tasks.filter((t) => t.status === c).reverse();
      return h('div', { class: 'col' }, h('h3', {}, h('span', {}, c), h('span', {}, items.length)), items.map(taskCard));
    })));
}

function draftCard(d) {
  const revise = h('textarea', { placeholder: 'What should change?', style: 'min-height:60px' });
  const reviseBox = h('div', { hidden: true }, revise,
    h('div', { class: 'row', style: 'margin-top:6px' },
      h('button', { class: 'btn primary sm', onclick: () => act(() => api('POST', B(`/drafts/${d.id}/decision`), { action: 'revise', note: revise.value }), 'Revising…') }, 'Send revision request')));
  const reasonBox = h('input', { placeholder: 'Reason (optional)', style: 'flex:1;min-width:140px' });
  const open = d.status === 'Awaiting approval';
  const qc = d.qc;
  return h('div', { class: 'panel' },
    h('div', { class: 'row spread' },
      h('div', {}, h('h3', {}, d.title), h('div', { class: 'row' }, statusTag(d.status), h('span', { class: 'tag muted' }, d.kind === 'outreach' ? 'Outreach' : 'Content'), d.platform ? h('span', { class: 'tag muted' }, d.platform) : null, h('span', { class: 'meta' }, `${d.id} · ${fmtDate(d.createdAt)}`))),
      d.body ? h('button', { class: 'btn sm', onclick: () => copy(d.body) }, 'Copy text') : null),
    d.status === 'Generating' ? h('p', { class: 'note' }, h('span', { class: 'spin' }), ' The agent is writing and the Quality Checker will review it. Usually under a minute.') : null,
    d.error ? h('p', { class: 'tag bad' }, d.error) : null,
    d.body ? h('div', { class: 'draft-body' }, d.body) : null,
    d.visual ? h('details', {}, h('summary', {}, 'Visual direction'), h('div', { class: 'draft-body' }, d.visual)) : null,
    d.unsure?.length ? h('div', { class: 'qc revise' }, h('strong', {}, 'The agent was unsure about:'), h('ul', {}, d.unsure.map((u) => h('li', {}, u)))) : null,
    qc ? h('div', { class: `qc ${qc.decision}` },
      h('strong', {}, 'Quality check: '), statusTag(qc.decision === 'approve' ? 'Approved' : qc.decision === 'revise' ? 'Awaiting approval' : 'Failed'),
      h('span', { class: 'meta' }, ` suggests "${qc.decision}"`),
      qc.issues?.length ? h('ul', {}, qc.issues.map((x) => h('li', {}, x))) : h('p', { class: 'note' }, 'No issues found.'),
      qc.suggested_revision && open ? h('details', {}, h('summary', {}, 'Suggested revision'), h('div', { class: 'draft-body' }, qc.suggested_revision),
        h('button', { class: 'btn sm', onclick: () => act(() => api('POST', B(`/drafts/${d.id}/decision`), { action: 'apply_suggestion' }), 'Applied. Re-checking…') }, 'Use this version')) : null) : null,
    open || d.status === 'Failed' ? h('div', { class: 'row', style: 'margin-top:8px' },
      open ? h('button', { class: 'btn good', onclick: () => act(() => api('POST', B(`/drafts/${d.id}/decision`), { action: 'approve' }), 'Approved and saved to the brand folder. Post it yourself when ready.') }, 'Approve') : null,
      h('button', { class: 'btn', onclick: () => { reviseBox.hidden = !reviseBox.hidden; } }, 'Revise'),
      reasonBox,
      h('button', { class: 'btn bad', onclick: () => act(() => api('POST', B(`/drafts/${d.id}/decision`), { action: 'reject', note: reasonBox.value }), 'Rejected') }, 'Reject')) : null,
    reviseBox,
    d.savedTo ? h('p', { class: 'note' }, `Saved to brands/${S.slug}/${d.savedTo}. Ready to post manually.`) : null,
    d.versions?.length ? h('details', {}, h('summary', {}, `Earlier versions (${d.versions.length})`), d.versions.slice().reverse().map((v) => h('div', { class: 'draft-body' }, h('div', { class: 'meta' }, fmtDate(v.at)), v.body))) : null,
    d.history?.length ? h('details', {}, h('summary', {}, 'History'), h('ul', {}, d.history.map((x) => h('li', { class: 'meta' }, `${fmtDate(x.at)} · ${x.action}${x.note ? `: ${x.note}` : ''}`)))) : null);
}

function pageApprovals() {
  const filters = ['Awaiting approval', 'Generating', 'Approved', 'Rejected', 'Failed', 'All'];
  const items = S.state.drafts.filter((d) => S.approvalsFilter === 'All' || d.status === S.approvalsFilter).reverse();
  return h('div', {},
    h('div', { class: 'row spread' }, h('h1', {}, 'Approvals'), h('button', { class: 'btn sm', onclick: () => download('drafts') }, 'Export CSV')),
    h('p', { class: 'sub' }, 'Nothing goes public without you. Approve, ask for a revision, or reject. Approved drafts are saved to the brand folder for you to post.'),
    h('div', { class: 'row', style: 'margin-bottom:14px' }, filters.map((f) => {
      const n = f === 'All' ? S.state.drafts.length : S.state.drafts.filter((d) => d.status === f).length;
      return h('button', { class: `btn sm ${S.approvalsFilter === f ? 'primary' : ''}`, onclick: () => { S.approvalsFilter = f; render(); } }, `${f} (${n})`);
    })),
    items.length ? items.map(draftCard) : h('p', { class: 'empty' }, 'Nothing here. Create drafts from Tasks.'));
}

function pageLeads() {
  const st = S.state;
  const niche = h('input', { placeholder: 'Niche, e.g. boutiques, clinics, wholesalers', style: 'flex:2;min-width:180px' });
  const area = h('input', { placeholder: 'Area, e.g. Uttam Nagar', style: 'flex:1;min-width:140px' });
  const count = h('input', { type: 'number', min: 1, max: 15, value: 10, style: 'width:70px', 'aria-label': 'How many' });
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rKind = h('select', {}, h('option', { value: 'research' }, 'Lead research (uses the niche + area above)'), h('option', { value: 'report' }, 'Daily report'));
  const rDay = h('select', {}, h('option', { value: '' }, 'Every day'), days.map((d, i) => h('option', { value: i, selected: i === 1 }, `Every ${d}`)));
  const rHour = h('select', {}, Array.from({ length: 24 }, (_, i) => h('option', { value: i, selected: i === 9 }, `${String(i).padStart(2, '0')}:00`)));
  const leads = st.leads.filter((l) => S.leadFilter === 'all' || l.reviewStatus === S.leadFilter).slice().reverse();

  const manual = { name: h('input', { placeholder: 'Business name' }), source: h('input', { placeholder: 'Public source URL (required)' }), website: h('input', { placeholder: 'Website (optional)' }), area: h('input', { placeholder: 'Area' }), niche: h('input', { placeholder: 'Niche' }), fit: h('input', { placeholder: 'Why they might need you' }) };

  return h('div', {},
    h('div', { class: 'row spread' }, h('h1', {}, 'Leads'), h('button', { class: 'btn sm', onclick: () => download('leads') }, 'Export CSV')),
    h('p', { class: 'sub' }, 'Public business information only, always with its source. Every lead starts as "Needs human verification", and outreach is drafted only for verified leads. You send it yourself, and only where contact is allowed.'),
    h('div', { class: 'grid two' },
      h('section', { class: 'panel' }, h('h2', {}, 'Research new leads'),
        h('div', { class: 'row' }, niche, area, count),
        h('div', { class: 'row', style: 'margin-top:10px' },
          h('button', { class: 'btn primary', onclick: () => act(() => api('POST', B('/leads/research'), { niche: niche.value, area: area.value, count: count.value }), 'Research started. This can take a few minutes.') }, 'Find leads'),
          h('span', { class: 'note' }, 'Uses web search. Results are checked: no source URL, no lead.'))),
      h('section', { class: 'panel' }, h('h2', {}, 'Routines (automatic runs)'),
        st.routines.length ? h('ul', {}, st.routines.map((r) => h('li', {},
          `${r.kind === 'research' ? `Find ${r.input.count} × ${r.input.niche} in ${r.input.area}` : 'Daily report'} · ${r.day === null ? 'every day' : `every ${days[r.day]}`} at ${String(r.hour).padStart(2, '0')}:00 `,
          h('span', { class: 'meta' }, r.lastRunAt ? `(last run ${fmtDate(r.lastRunAt)}) ` : '(not run yet) '),
          h('button', { class: 'btn sm', onclick: () => act(() => api('PATCH', B(`/routines/${r.id}`), { enabled: !r.enabled })) }, r.enabled ? 'Pause' : 'Resume'), ' ',
          h('button', { class: 'btn sm bad', onclick: () => act(() => api('PATCH', B(`/routines/${r.id}`), { delete: true }), 'Routine removed') }, 'Remove'))))
          : h('p', { class: 'note' }, 'No routines yet. A weekly lead search lands new leads in your verification queue.'),
        h('div', { class: 'row' }, rKind, rDay, rHour,
          h('button', { class: 'btn', onclick: () => act(() => api('POST', B('/routines'), { kind: rKind.value, day: rDay.value, hour: rHour.value, niche: niche.value, area: area.value, count: count.value }), 'Routine saved') }, 'Add routine')),
        h('p', { class: 'note' }, 'Routines run while the office server is running (server time).'))),
    h('div', { class: 'row', style: 'margin:6px 0 10px' }, ['all', 'Needs human verification', 'Verified', 'Rejected'].map((f) =>
      h('button', { class: `btn sm ${S.leadFilter === f ? 'primary' : ''}`, onclick: () => { S.leadFilter = f; render(); } },
        `${f === 'all' ? 'All' : f} (${f === 'all' ? st.leads.length : st.leads.filter((l) => l.reviewStatus === f).length})`))),
    leads.length ? h('div', { class: 'panel tbl' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Business', 'Area / niche', 'Source', 'Why a fit', 'Public contact', 'Review', 'Contact status', 'Next action', ''].map((x) => h('th', {}, x)))),
      h('tbody', {}, leads.map((l) => h('tr', {},
        h('td', {}, h('strong', {}, l.businessName), h('br'), extLink(l.website), h('div', { class: 'meta' }, `${l.id} · ${l.origin}`)),
        h('td', {}, l.area, h('br'), h('span', { class: 'meta' }, l.niche)),
        h('td', {}, extLink(l.sourceUrl, 'source')),
        h('td', {}, l.fitReason),
        h('td', {}, l.publicContact || h('span', { class: 'meta' }, '—')),
        h('td', {}, h('select', { onchange: (e) => act(() => api('PATCH', B(`/leads/${l.id}`), { reviewStatus: e.target.value })) },
          ['Needs human verification', 'Verified', 'Rejected'].map((s) => h('option', { selected: s === l.reviewStatus }, s)))),
        h('td', {}, h('select', { onchange: (e) => act(() => api('PATCH', B(`/leads/${l.id}`), { contactStatus: e.target.value })) },
          ['Not contacted', 'Contacted manually', 'Replied', 'Client', 'Do not contact'].map((s) => h('option', { selected: s === l.contactStatus }, s)))),
        h('td', {}, h('input', { value: l.nextAction || '', placeholder: 'e.g. Visit shop Fri', style: 'width:140px', onchange: (e) => act(() => api('PATCH', B(`/leads/${l.id}`), { nextAction: e.target.value }), 'Saved') })),
        h('td', {}, h('button', { class: 'btn sm', disabled: l.reviewStatus !== 'Verified' || l.contactStatus === 'Do not contact', title: l.reviewStatus !== 'Verified' ? 'Verify the lead first' : '',
          onclick: () => act(() => api('POST', B(`/leads/${l.id}/outreach`), {}), 'Drafting message… see Approvals') }, 'Draft message'))))))) : h('p', { class: 'empty' }, 'No leads here yet.'),
    h('details', { class: 'panel' }, h('summary', {}, 'Add a lead you found yourself'),
      h('div', { class: 'grid two', style: 'margin-top:10px' }, Object.values(manual)),
      h('button', { class: 'btn primary', style: 'margin-top:10px', onclick: () => act(() => api('POST', B('/leads'), { businessName: manual.name.value, sourceUrl: manual.source.value, website: manual.website.value, area: manual.area.value, niche: manual.niche.value, fitReason: manual.fit.value }), 'Lead added') }, 'Add lead')));
}

function pageBrand() {
  const b = S.brand;
  const viewer = h('div', { class: 'viewer' });
  const showProfile = () => viewer.replaceChildren(md(b.profile));
  const open = async (f) => {
    S.file = f.path;
    if (f.path.endsWith('.html')) {
      const tokenQ = S.token ? `&token=${encodeURIComponent(S.token)}` : '';
      viewer.replaceChildren(h('div', { class: 'row spread' }, h('strong', {}, f.path)), h('iframe', { sandbox: '', src: B(`/file?path=${encodeURIComponent(f.path)}${tokenQ}`), title: f.path }));
    } else {
      try {
        const text = await api('GET', B(`/file?path=${encodeURIComponent(f.path)}`));
        viewer.replaceChildren(h('div', { class: 'row spread' }, h('strong', {}, f.path), h('button', { class: 'btn sm', onclick: () => copy(text) }, 'Copy')), f.path.endsWith('.md') ? md(text) : h('pre', { class: 'draft-body' }, text));
      } catch (e) { toast(e.message, true); }
    }
    for (const a of document.querySelectorAll('.files a')) a.classList.toggle('on', a.dataset.path === f.path);
  };
  const groups = {};
  for (const f of b.files) (groups[f.path.includes('/') ? f.path.split('/')[0] : 'Brand folder'] ||= []).push(f);
  const cmds = ['hub-report', 'hub-strategy', 'hub-content', 'hub-grow', 'hub-status'].map((c) => `/${c} ${S.slug}`);
  setTimeout(() => { if (S.file) { const f = b.files.find((x) => x.path === S.file); if (f) open(f); else showProfile(); } else showProfile(); });
  return h('div', {},
    h('h1', {}, `${b.name}: brand & reports`),
    h('p', { class: 'sub' }, `Everything the hub has produced for this brand. Stage: ${b.stage} · Profile ${b.completeness}% complete.`),
    h('div', { class: 'grid', style: 'grid-template-columns:minmax(220px,280px) 1fr;align-items:start' },
      h('div', {},
        h('section', { class: 'panel files' },
          h('a', { href: '#/brand', onclick: (e) => { e.preventDefault(); S.file = null; showProfile(); } }, h('strong', {}, 'Brand profile')),
          Object.entries(groups).sort().map(([g, fs]) => h('div', {}, h('div', { class: 'meta', style: 'margin:8px 0 2px' }, g),
            fs.map((f) => h('a', { href: '#/brand', 'data-path': f.path, onclick: (e) => { e.preventDefault(); open(f); } }, f.path.split('/').slice(1).join('/') || f.path))))),
        h('section', { class: 'panel' }, h('h3', {}, 'Hub commands'), h('p', { class: 'note' }, 'Paste into the Claude Code chat:'),
          cmds.map((c) => h('div', { class: 'row spread', style: 'margin:4px 0' }, h('code', {}, c), h('button', { class: 'btn sm', onclick: () => copy(c) }, 'Copy'))))),
      h('section', { class: 'panel' }, viewer)));
}

function pageActivity() {
  const runs = S.state.runs;
  return h('div', {},
    h('h1', {}, 'Activity'),
    h('p', { class: 'sub' }, 'Every AI run: which agent, for what, how long it took, and whether it worked. Failed runs are never retried automatically, except one retry when the reply was unreadable.'),
    runs.length ? h('div', { class: 'panel tbl' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Run', 'Agent', 'For', 'Status', 'Time', 'Cost', 'Started', 'Problem'].map((x) => h('th', {}, x)))),
      h('tbody', {}, runs.map((r) => h('tr', {},
        h('td', {}, r.id), h('td', {}, r.agent), h('td', {}, r.ref), h('td', {}, statusTag(r.status)),
        h('td', {}, r.durationMs ? `${Math.round(r.durationMs / 1000)}s` : ''), h('td', {}, r.costUsd ? `$${r.costUsd.toFixed(3)}` : ''),
        h('td', {}, fmtDate(r.createdAt)), h('td', {}, r.error || '')))))) : h('p', { class: 'empty' }, 'No AI runs yet.'));
}

async function download(collection) {
  try {
    const headers = S.token ? { 'X-Office-Token': S.token } : {};
    const res = await fetch(B(`/export/${collection}.csv`), { headers });
    if (!res.ok) throw new Error('Export failed');
    const url = URL.createObjectURL(await res.blob());
    const a = h('a', { href: url, download: `${S.slug}-${collection}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) { toast(e.message, true); }
}

// ───────────── shell ─────────────
const PAGES = { today: pageToday, command: pageCommand, tasks: pageTasks, approvals: pageApprovals, leads: pageLeads, brand: pageBrand, activity: pageActivity };

function render() {
  for (const a of document.querySelectorAll('#nav a')) a.classList.toggle('on', a.dataset.page === S.page);
  const awaiting = S.state ? S.state.drafts.filter((d) => d.status === 'Awaiting approval').length : 0;
  const verify = S.state ? S.state.leads.filter((l) => l.reviewStatus === 'Needs human verification').length : 0;
  Object.assign($('#badge-approvals'), { hidden: !awaiting, textContent: awaiting });
  Object.assign($('#badge-leads'), { hidden: !verify, textContent: verify });
  if (!S.slug) {
    main.replaceChildren(h('div', { class: 'empty' }, 'No brands yet. In the Claude Code chat, run /hub-onboard with your brand details, then reload this page.'));
    return;
  }
  if (!S.state || !S.brand) {
    main.replaceChildren(h('p', {}, h('span', { class: 'spin' }), ' Loading…'));
    return;
  }
  main.replaceChildren((PAGES[S.page] || pageToday)());
}

// Re-render on new data, but never while the user is typing in a field on the page.
function userIsTyping() {
  const el = document.activeElement;
  return el && main.contains(el) && /INPUT|TEXTAREA|SELECT/.test(el.tagName);
}

async function refresh(force = false) {
  if (!S.slug) return;
  const [state, health] = await Promise.all([api('GET', B('/state')), api('GET', '/api/health')]);
  S.health = health;
  renderHealth();
  const key = JSON.stringify(state);
  if (!force && key === S.stateKey) return;
  S.state = state;
  S.stateKey = key;
  if (force || !userIsTyping()) render();
}

function renderHealth() {
  const hh = S.health;
  if (!hh) return;
  const cls = hh.runner === 'mock' ? 'mock' : hh.ready ? '' : 'off';
  const label = hh.runner === 'mock' ? 'Demo mode (no AI calls)' : hh.ready ? 'Claude connected (your plan)' : 'Claude CLI not found';
  $('#health').replaceChildren(h('span', { class: `dot ${cls}` }), label, h('br'), `AI runs today: ${hh.runsToday}/${hh.dailyRunLimit}`);
}

async function loadBrand(slug) {
  S.slug = slug;
  S.state = null;
  S.brand = null;
  S.stateKey = '';
  S.file = null;
  try { localStorage.setItem('office-brand', slug); } catch { /* ignore */ }
  render();
  S.brand = await api('GET', B(''));
  await refresh(true);
}

async function poll() {
  try {
    await refresh();
  } catch { /* transient; next poll retries */ }
  const busy = S.state && (S.state.busy || S.state.drafts.some((d) => d.status === 'Generating'));
  setTimeout(poll, busy ? 3000 : 15000);
}

async function boot() {
  S.page = (location.hash.match(/^#\/(\w+)/) || [, 'today'])[1];
  window.addEventListener('hashchange', () => {
    S.page = (location.hash.match(/^#\/(\w+)/) || [, 'today'])[1];
    render();
  });
  try {
    const { brands, active } = await api('GET', '/api/brands');
    S.brands = brands;
    let saved = '';
    try { saved = localStorage.getItem('office-brand') || ''; } catch { /* ignore */ }
    const pick = [saved, active].find((s) => brands.some((b) => b.slug === s)) || brands[0]?.slug || '';
    const sel = $('#brand');
    sel.replaceChildren(...brands.map((b) => h('option', { value: b.slug, selected: b.slug === pick }, b.name)));
    sel.onchange = () => loadBrand(sel.value);
    if (pick) await loadBrand(pick);
    else render();
  } catch (e) {
    main.replaceChildren(h('div', { class: 'empty' }, `Could not reach the office server: ${e.message}`));
  }
  setTimeout(poll, 3000);
}

boot();
