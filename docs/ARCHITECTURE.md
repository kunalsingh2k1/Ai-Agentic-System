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

## Data (brands/<slug>/office/)
| File | Shape | Written by | Size expectation |
|---|---|---|---|
| tasks.json | `[{id T-0001, task, priority, owner, deadline, status, notes, skill, request}]` | manager agent (validated), owner | 100s |
| drafts.json | `[{id D-0001, kind content/outreach, taskId/leadId, title, platform, body, visual, unsure[], qc{decision,issues,suggested_revision}, status, versions[], history[]}]` | content/follow-up/QC agents, owner decisions | 100s |
| leads.json | `[{id L-0001, businessName, website, niche, area, sourceUrl (required), publicContact, fitReason, reviewStatus, contactStatus, nextAction, origin}]` | research agent (validated, deduped), owner | 100s–low 1000s |
| runs.json | `[{id R-0001, agent, ref, status, durationMs, costUsd, error}]` capped at 500 | runner wrapper | ≤500 |
| log.json | one daily report per date | report() | 1/day |
| routines.json | `[{id W-0001, kind research/report, input, day 0-6 or null, hour, enabled, lastRunAt}]` | owner | a handful |

Arrays of objects, read whole and rewritten whole. Trade-off: simple and diffable, but O(n) per write and single-process only (see FAILURE.md).
