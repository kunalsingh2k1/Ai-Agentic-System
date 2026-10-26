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
