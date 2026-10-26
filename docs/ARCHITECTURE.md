# Architecture

Two parts share one folder of brand data.

```
 Owner ──► Claude Code chat ──► .claude/skills (48 marketing skills + 6 hub-* pipelines)
   │                                   │ writes deliverables (md/html/csv)
   │                                   ▼
   │                          brands/<slug>/  ◄────────────── single source of truth
   │                                   ▲  reads profile/voice   │ writes approved drafts, LOG.md lines
   ▼                                   │                        │
 Browser ──HTTP(localhost)──► office/server.mjs ──► lib/office.mjs (workflow) ──► lib/store.mjs
   UI: office/public                   │                                          brands/<slug>/office/*.json
                                       └──► lib/runner.mjs ──spawn──► claude -p (owner's plan)
                                                                       per-agent tools only, temp cwd
```

## Modules and what they own
| Module | Owns |
|---|---|
| `.claude/skills/*` + `CLAUDE.md` | Deep marketing work run interactively: reports, strategy, calendars |
| `office/lib/office.mjs` | Workflow rules: task intake, draft → QC → approval gate, lead verification, routines, run cap |
| `office/lib/agents.mjs` | Agent prompts and **output validation** (the only path from AI text to stored data) |
| `office/lib/runner.mjs` | Spawning the Claude CLI with least privilege; mock runner for tests/demo |
| `office/lib/store.mjs` | JSON persistence, serialized atomic writes, IDs |
| `office/lib/skills.mjs` | Skill catalogue: hub skills (live from `.claude/skills`) + `skills-library/index.json`; search, resolve, load SKILL.md + small references |
| `office/lib/snapshot.mjs` | Before/after snapshots of a brand folder, diff, undo with conflict detection |
| `office/scripts/sync-skills.mjs` | Copies personal skills from `~/.claude` into `skills-library/` and indexes them |
| `office/lib/brands.mjs` | Reading brand folders safely; writing approved drafts and LOG lines |
| `office/server.mjs` | HTTP routing, CSRF guard, token, security headers, CSV export, minute scheduler |
| `office/public/*` | UI: no framework; all AI/brand text inserted as text |

## Trust boundaries (where outside input enters)
1. **Browser → server**: every request body is validated in `office.mjs`; mutations need `X-Office: 1` + JSON.
2. **Web pages → research agent**: untrusted content; the agent has no write tools and its output passes `normaliseLead`.
3. **Model output → store**: `agents.*.validate()` whitelists fields, enums and lengths; anything else is dropped.
4. **Brand files → UI**: Markdown is HTML-escaped before formatting; HTML reports load in a sandboxed iframe with a no-script CSP.

## Request flow: "Draft with AI"
`app.js taskCard → POST /tasks/:id/draft → server route → Office.createDraft` (inserts draft "Generating", sets the task to In Progress) → background `generate` → `runAgent('content')` (cap check → semaphore → `brands.agentContext` → `runner.run` → `extractJson` → `validate`, with 1 retry on invalid JSON) → `check` → `runAgent('qc')` → draft "Awaiting approval". The UI polls `/state` every 3 s while anything is generating.
`Approve → Office.decide` → `brands.saveApproved` (04-content/approved/…) + task Done + LOG.md line.

## Skill Worker flow (edits files)
`Run skill` / Skills page / plan step → `Office.workerJob` (per-brand lock) → `snapshot(brand dir)` → `runAgent('worker')` with the skill's SKILL.md + references injected, cwd = brand folder, `--restricted` + deny office/data → `snapshot` again → `diff` → undo record in `office/snapshots/R-xxxx.json` → run record `review: Pending review` → owner **Keep** or **Undo all** (`restore`).

## Orchestrator flow
Goal → `Office.plan` → Orchestrator agent (candidates = keyword matches across 973 skills + all hub skills) → plan `Proposed` → owner skips/edits steps → **Approve & run** → `executePlan` runs steps in order: worker → `workerJob`, research → `research`, content → draft in Approvals. Each step receives earlier steps' summaries and file paths. Failure → `Stopped`; Resume re-runs from the failed step.

## Data (brands/<slug>/office/)
| File | Shape | Written by | Size expectation |
|---|---|---|---|
| tasks.json | `[{id T-0001, task, priority, owner, deadline, status, notes, skill, request}]` | manager agent (validated), owner | 100s |
| drafts.json | `[{id D-0001, kind content/outreach, taskId/leadId, title, platform, body, visual, unsure[], qc{decision,issues,suggested_revision}, status, versions[], history[]}]` | content/follow-up/QC agents, owner decisions | 100s |
| leads.json | `[{id L-0001, businessName, website, niche, area, sourceUrl (required), publicContact, fitReason, reviewStatus, contactStatus, nextAction, origin}]` | research agent (validated, deduped), owner | 100s–low 1000s |
| runs.json | `[{id R-0001, agent, ref, status, durationMs, costUsd, error}]` capped at 500 | runner wrapper | ≤500 |
| log.json | one daily report per date | report() | 1/day |
| plans.json | `[{id P-0001, goal, title, status Planning/Proposed/Running/Stopped/Done/Failed/Cancelled, steps[{n, title, agent, skill, instructions, dependsOn[], status, summary, files[], error}]}]` | orchestrator, owner | tens |
| snapshots/R-xxxx.json | undo records (changed paths, old text, new hash); last 30 kept; git-ignored | worker runs | 30 files |
| routines.json | `[{id W-0001, kind research/report, input, day 0-6 or null, hour, enabled, lastRunAt}]` | owner | a handful |

Arrays of objects, read whole and rewritten whole. Trade-off: simple and diffable, but O(n) per write and single-process only (see FAILURE.md).
