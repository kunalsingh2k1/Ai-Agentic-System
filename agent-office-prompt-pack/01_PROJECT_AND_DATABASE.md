# 01 · Project management + database

Read this before writing any code. Part A sets up how the build is tracked. Part B is the database, which is already written (`db/schema.sql`) and tested on PostgreSQL 16.

---

## Part A — Project management

### A1. Phases and gates

Work in this order. At the end of each phase, stop, show the evidence listed under **Gate**, and wait for the owner's OK before starting the next one.

| # | Phase | Output | Gate (evidence to show) |
|---|---|---|---|
| P0 | Setup | Repo, `PROJECT.md`, `environment.yaml` filled, `.env.example` | Tree of the repo; filled profile with every `TODO` gone |
| P1 | Database | `db/` migrations applied, seed generated from `environment.yaml` | `db/test_lifecycle.sql` output with zero ERRORs |
| P2 | Server API | REST + SSE (`02_CLAUDE_INTEGRATION.md` §6) running on a mock runner | `curl` transcript: create task → approve → done; SSE log of the same |
| P3 | Claude runner | Draft / write phases through Claude Code CLI, routing, questions | One real read-only report task and one write task stopped at **Needs approval** (do not approve against live data in this phase) |
| P4 | UI | `03_UI_BASE.md` built against the API, plus demo mode | Playwright screenshots: desktop, tablet, phone × light, dark |
| P5 | Routines + notifications | Scheduler tick, chat notifications for "needs you" | A routine firing on time in the calendar; a notification in the test channel |
| P6 | Pilot | One department live for 5 working days | Pilot log: tasks run, approvals, failures, fixes |
| P7 | Hardening | Backups, restart-on-boot, remote access, runbook | Restore drill done; runbook `RUNBOOK.md` |

### A2. Tracker — `PROJECT.md` (keep it at repo root, update every session)

```markdown
# <Workspace short name> Agent Office — Project

## Status            (one line, updated every session)
P2 Server API — 70%. Blocked on: nothing.

## Now               (max 5 items, each with an owner)
- [ ] OFFICE-14 SSE reconnect with Last-Event-ID — Claude
- [ ] OFFICE-15 Approve endpoint returns 409 text from DB — Claude

## Next
- OFFICE-16 ...

## Done (this phase)
- [x] OFFICE-12 claim_next_task wired into worker loop — 2026-10-22

## Decisions         (newest first; never delete)
- 2026-10-22 D-07 Write phase resumes the draft session, write tools only. Why: keeps context, smaller prompt.

## Risks             (likelihood × impact, owner, mitigation)
- R-03 ERP rate limit (429) mid-write → partial records. Mitigation: stop, never auto-retry writes, show "Check <system> first".

## Open questions for the owner
- Q-04 Which chat channel gets approval pings?
```

Rules:
- Every piece of work has a ref `KEY-n`. The same items live in the `project` / `milestone` / `work_item` tables (the office tracks its own build — use `v_project_progress` for the % on the dashboard).
- Decisions and risks are append-only.
- A session ends with: Status line updated, Now/Done moved, any new decision recorded.
- Never mark an item done without its evidence (test output, screenshot, transcript).

### A3. Repo layout

```
/db            schema.sql, seed_example.sql, test_lifecycle.sql, migrations/NNNN_name.sql
/server        src/{api,stream,runner,router,scheduler,connectors,vault,notify}/  tests/
/web           src/{app,components,scene,views,lib,demo}/  tests/ (Playwright)
/vault-sample  SOP/ Rules/ Ref/ Org/   (example notes; the real vault lives outside the repo)
/ops           service files, tunnel config, backup scripts
PROJECT.md  RUNBOOK.md  environment.yaml  .env.example
```

---

## Part B — Database

### B1. Engine
PostgreSQL 15+ (local install on the office PC, or Supabase). Everything lives in schema `office`. `db/schema.sql` is the first migration; later changes go in `db/migrations/0002_*.sql`, never by editing applied files.

### B2. What is in it (29 tables)

| Group | Tables | Purpose |
|---|---|---|
| Setup | `workspace` (singleton), `app_user`, `entity`, `entity_relation`, `setting` | Who the business is, who signs in, which companies/branches agents act on and who may trade with whom |
| Office structure | `department`, `agent`, `connector`, `agent_connector`, `routing_rule` | Departments, their agents, the outside systems (MCP), per-agent **read** vs **write** tool lists, keyword routing |
| Knowledge | `vault_note`, `agent_note` | Index of the read-only markdown vault and which notes each agent must follow |
| Project mgmt | `project`, `milestone`, `work_item` | Projects → milestones → items with auto refs (`OFFICE-12`), dependencies, % done |
| Work | `task`, `task_event`, `proposal`, `question`, `write_call`, `attachment`, `task_file`, `agent_run` | The job, its timeline, the change waiting for approval, questions back to a human, every outside write (idempotent), files in/out, each Claude process |
| Scheduling | `routine` | Recurring work; `next_run_at` maintained by trigger, timezone-aware |
| Live state | `office_state` (singleton), `kpi`, `notification`, `audit_log` | Run/pause/stop, department numbers, outbound pings, who did what |

### B3. Task status machine (enforced by trigger `task_guard`)

```
queued ──► working ──► done                       (reports / read-only)
  │           │
  │           ├──► question ──► working            (agent asked, human answered)
  │           │
  │           └──► needs_approval ──► writing ──► done
  │                     │                 └──► failed / stopped
  │                     ├──► rejected
  │                     └──► working               ("run the draft again")
  └──► stopped / failed
failed | stopped | rejected ──► queued             (retry: attempt+1, clears result/error/approval)
```

Hard rules in the database, not only in the app:
- Illegal transitions raise `Illegal task transition A -> B`.
- `writing` is refused unless `approved_by` is set **and** an approved `proposal` exists.
- One pending proposal and one open question per task (partial unique indexes).
- `write_call.idempotency_key` is unique → the same write can never be recorded twice.
- A held task (`held = true`) is never claimed until a human presses Start.

### B4. Functions the server calls

| Function | Use |
|---|---|
| `claim_next_task()` | Worker loop, every 1 s. Respects office mode, `held`, per-agent `max_parallel`, priority then age. `SKIP LOCKED` → safe with several workers. |
| `approve_task(task, user)` / `reject_task(task, user, note)` | Approve/Reject buttons. Raise a clear message when the task is not waiting. |
| `fire_due_routines(now)` | Scheduler tick every 30–60 s. Creates tasks (held if `needs_ok`, `late` if the agent is busy) and reschedules. |
| `routine_next_run(...)` | Next run in the routine's own timezone; monthly 31st → last day of short months. |
| `route_text(text)` | Keyword routing score (phrase = 2, word = 1). `null` → fall back to the LLM router. |

Every task insert/update and every event fires `pg_notify('office', {...})`. The server `LISTEN`s once and fans out to SSE clients — the UI never polls.

### B5. Views for the UI
`v_department_board` (rail counts), `v_agent_status` (live state per agent), `v_needs_you` (approve / answer / start), `v_activity` (feed), `v_project_progress`.

### B6. Seeding from the environment profile
Write `server/scripts/seed.ts` that reads `environment.yaml` and generates the same inserts as `db/seed_example.sql` (workspace, users, entities, relations, departments, connectors, agents, tool lists, routing, vault notes, KPIs, routines, the build project). It must be re-runnable (upsert on `key`). Never put secrets in the database — `connector.secret_env` only names environment variables.

### B7. Supabase specifics
If roles `authenticated`/`anon` exist, the schema turns on RLS for every table with read-only access for signed-in users and none for anon. All writes go through the server using the service role. Do not expose the service key to the browser.

### B8. Backups and checks
- Nightly `pg_dump -Fc` to a second disk/cloud folder, keep 14 days; restore drill in P7.
- Weekly: `select status, count(*) from office.task group by 1` and `select * from office.v_needs_you` older than 24 h → included in the owner's digest.

### B9. Test
```bash
createdb office_test
psql -v ON_ERROR_STOP=1 -d office_test -f db/schema.sql -f db/seed_example.sql
psql -d office_test -f db/test_lifecycle.sql   # expect "OK blocked" notices, zero ERROR
```
Covers: routing, paused office blocks claims, illegal jump blocked, proposal → approve → writing → done, double approve refused, reject → retry (attempt 2, proposal kept as rejected), held tasks skipped, routine firing + reschedule, monthly 31st, timezone, project refs and %, all views.
