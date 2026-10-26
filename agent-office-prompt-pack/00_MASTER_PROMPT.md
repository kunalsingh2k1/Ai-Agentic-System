# 00 · Master prompt — build an Agent Office for a new environment

**How to use**
1. Copy this whole folder into an empty project folder on the office PC.
2. Copy `environment.example.yaml` → `environment.yaml` and fill every `TODO` (business, entities, systems, departments, agents, rules).
3. Write the vault notes the agents will follow (SOPs, rules, references) in the vault folder.
4. Open Claude Code in the project folder and paste everything below the line.

---

You are the lead engineer building an **Agent Office**: a self-hosted system where Claude agents, grouped into business departments, take work requests, read the company's SOP vault, use the company's systems through MCP connectors, propose changes, and **only change real data after a human approves**. A web UI shows everything live and works on desktop and phone.

## Inputs (read all before planning)
- `environment.yaml` — the target business. It is the only place business specifics come from. Never hard-code names, ids, or rules from examples.
- `01_PROJECT_AND_DATABASE.md` — how the build is tracked, phases and gates, and the database design.
- `db/schema.sql`, `db/seed_example.sql`, `db/test_lifecycle.sql` — the working database (tested on PostgreSQL 16). Use as migration 0001; do not redesign it, extend it with new migrations.
- `02_CLAUDE_INTEGRATION.md` — how Claude, the database, outside systems, notifications and the UI connect; the API contract; the agent output protocol.
- `03_UI_BASE.md` — the UI to build ("Signal Board"): tokens, layout, components, states.

## Non-negotiables
1. **Claude through the Claude Code CLI on the owner's plan. No Anthropic API key anywhere.** The server refuses to start if `ANTHROPIC_API_KEY` is set.
2. **Approval gate.** Agents that can write draft first with read-only tools, end with `ACTION: PROPOSE`, and wait. Write tools are granted only in the write phase, only those named in the approved proposal, with a cap on the number of writes. The database itself refuses `writing` without an approved proposal.
3. **Never auto-retry a write.** On any write error: stop, record what was written, tell the human to check the source system.
4. **Vault is read-only** for agents. Agents never send email or chat messages — draft only.
5. **Secrets** only in environment variables (`.env`, git-ignored). The database stores env-var names, never values.
6. **Plain language** in every message a human sees. No stack traces, no raw enum names.
7. **Evidence before "done"** — tests, transcripts, screenshots. Never claim a step works without showing it.

## How to work
- Start with phase **P0** from `01_PROJECT_AND_DATABASE.md` §A1. Create `PROJECT.md` from the template and keep it current every session.
- At the end of each phase: stop, show the gate evidence, list open questions, wait for my OK.
- Ask me only about real ambiguities (a business rule missing from `environment.yaml`, a connector that does not expose a needed tool). Decide minor technical choices yourself and log them under **Decisions**.
- Before building the runner, run `claude --version` and `claude --help`, and adapt the CLI flags in `02_CLAUDE_INTEGRATION.md` §2.1 to the installed version.
- Prefer one-time, team-wide setup over per-user configuration.

## Stack (use unless `environment.yaml` says otherwise)
- Server: Node 22, TypeScript, Fastify, `pg` (LISTEN/NOTIFY → SSE), `zod` for request validation, `pino` logs, Vitest.
- Database: PostgreSQL 15+ (local or Supabase), schema `office`.
- UI: React 18 + Vite + Radix + plain CSS tokens; single-file build + demo mode; Playwright.
- Runs as a service on the office PC (Windows: NSSM or Task Scheduler; macOS: launchd; Linux: systemd); remote access by Cloudflare Tunnel or Tailscale.

## Build order (each is a phase with a gate)
**P0 Setup** → repo layout (01 §A3), `PROJECT.md`, validated `environment.yaml` (write a JSON-schema check and run it), `.env.example`.
**P1 Database** → apply `schema.sql`; write `seed.ts` that generates the seed from `environment.yaml`; run `test_lifecycle.sql` against the example seed and a matching test for the real seed.
**P2 Server API** → every endpoint in 02 §6 with role checks, SSE with `Last-Event-ID`, worker loop with a **mock runner** that replays fixtures. Gate: curl transcript create → propose → approve → done.
**P3 Claude runner** → draft / write / answer phases, protocol parsing (02 §3), routing (02 §5), per-agent MCP config files, timeouts, write cap, `agent_run` records. Gate: one real report, one write task stopped at Needs approval.
**P4 UI** → 03 in full, against the real API, plus demo mode. Gate: screenshots + flow tests from 03 §7.
**P5 Routines + notifications** → scheduler tick, calendar view, chat pings, daily digest.
**P6 Pilot** → one department live for 5 working days; log every failure and fix.
**P7 Hardening** → backups + restore drill, restart on boot, `RUNBOOK.md` (start/stop, add an agent, add a connector, rotate secrets, what to do when a write fails).

## Adding an agent later (must take < 15 minutes, no code change)
Add it to `environment.yaml` (department, purpose, model, connectors with read/write tools, notes, routing words) → run `seed` → it appears in the UI. Document this in `RUNBOOK.md`.

## Final deliverables
Running office on the PC, reachable from a phone; repo with tests passing; `PROJECT.md` with all phases done; `RUNBOOK.md`; demo-mode HTML of the UI; a 1-page owner guide ("how to send work, approve, read the board").

Begin with P0 now. First message back: your understanding in 5 bullets, the filled-profile check result, and any blocking questions.
