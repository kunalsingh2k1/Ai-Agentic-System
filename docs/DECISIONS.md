# Decisions (engineering)

Marketing decisions per brand live in `brands/<slug>/DECISIONS.md`. This file is for how the system is built. Rejected options are recorded under each decision (this file doubles as ALTERNATIVES.md).

## D-001: Claude Code CLI as the agent engine instead of n8n + Ollama
Date: 2026-10-26 · Model: claude-opus-5-5
Context: The AI Digital Office guide uses n8n + Ollama + Google Sheets + Telegram.
Options: 1) follow the guide (n8n, Ollama local model) 2) Gemini/Anthropic API key 3) Claude Code CLI in print mode on the owner's plan.
Chosen: 3.
Why: Already installed (bundled with the VS Code extension), no API key or bill, much stronger output than small local models, web research built in, and the same engine as the 48 hub skills.
Trade-off: Each run spawns a CLI process (~15–30 s) and counts against plan usage.
Revisit if: the owner needs runs while no machine is logged in to Claude, or wants a free local model for bulk work.

## D-002: Local web UI instead of Telegram as the command centre
Date: 2026-10-26 · Model: claude-opus-5-5
Options: 1) Telegram bot (guide) 2) local web UI 3) both.
Chosen: 2 now, Telegram later as an optional notifier.
Why: Approving drafts, verifying leads and reading reports need tables and long text, which suit a browser. No bot token to secure.
Trade-off: Not on the phone by default (Codespaces port forwarding or a tunnel works).
Revisit if: the owner wants approvals from the phone. Then add Telegram with a user-ID allow-list, notifications only, approvals still in the UI.

## D-003: JSON files per brand instead of Google Sheets or a database
Options: 1) Google Sheets (guide) 2) SQLite/Postgres 3) JSON files under brands/<slug>/office/.
Chosen: 3, with CSV export for Sheets.
Why: Zero setup and zero OAuth scopes. Data lives with the brand's other work; volumes are tiny.
Trade-off: Single process only, whole-file rewrites.
Revisit if: more than one server process, multiple users, or more than about 5k rows per collection.

## D-004: Zero npm dependencies
Why: Supply-chain risk and upkeep. Node built-ins (http, child_process, node:test) cover everything.
Trade-off: Hand-written router and Markdown renderer; the UI has no framework.

## D-005: Deterministic daily report (no AI)
Why: The guide warns "do not invent progress". Counting is exact and free.
Trade-off: No narrative summary.

## D-006: Background jobs + polling instead of long requests or websockets
Why: Agent runs take 15 s–7 min; polling every 3 s while busy is simple and robust.
Trade-off: Up to 3 s UI lag; extra requests while busy.

## D-007: Hard daily cap on AI runs (default 40) and max 2 concurrent runs
Why: Cost limits from the guide's security checklist. Routines can't run away.
Trade-off: The in-memory counter resets on restart.

## D-008: Personal skills library (973 skills) shared by all agents
Date: 2026-10-27 · Model: claude-opus-5-5
Context: Owner asked to use the skills from their personal Claude account inside the office.
Options:
1) copy everything into `.claude/skills` (Claude Code would list ~970 skills in every session: noisy, slow, and names collide with the hub's)
2) point agents at `~/.claude` directly (it breaks on another machine, and the sync folders are internal)
3) copy into `skills-library/` with an index; agents get candidates by keyword search plus all hub skills.
Chosen: 3. `office/scripts/sync-skills.mjs` re-creates the folder; it's git-ignored (re-creatable, and it holds third-party skills that shouldn't go to a public repo).
Trade-off: keyword search can miss a skill whose words don't match the request, so hub skills are always offered.
Revisit if: the search picks badly. Then add descriptions-based ranking with a cheap model call.

## D-009: Skill Workers may edit files (supersedes "never give agents write tools")
Date: 2026-10-27 · Model: claude-opus-5-5
Context: Owner explicitly asked to give agents permission to edit.
Options: 1) keep agents read-only (server writes) 2) full repo write access 3) write access confined to one brand folder, with undo.
Chosen: 3.
- The runner uses `--restricted` (no Bash or other command tools; file tools confined to the cwd).
- cwd = `brands/<slug>/`.
- Deny rules for `./office/**` and `./data/**`.
- A snapshot before every run, with a diff and Keep / Undo-all review; undo skips files edited again since the run.
- One worker per brand at a time.
Verified with the real CLI on 2026-10-27: write inside allowed; office/, data/ and outside the folder denied (nothing created on disk).
Trade-off: a prompt-injected page could make a worker write junk files in the brand folder. That's contained to one folder, visible in review, and undoable. Binary files can't be restored by undo.
Revisit if: workers need to touch the website repo or other brands. That would need a separate decision.

## D-010: Orchestrator proposes, owner approves, steps run sequentially
Options: 1) fully autonomous multi-agent run 2) plan → approval → sequential execution 3) parallel DAG execution.
Chosen: 2. The owner approves the plan before anything runs ("approve the plan, then the code"). Steps run one at a time, so each builds on the last and the worker lock stays simple. A failed step stops the plan; Resume re-runs only that step (no auto-retry).
Trade-off: slower than parallel; ≤8 steps per plan.
