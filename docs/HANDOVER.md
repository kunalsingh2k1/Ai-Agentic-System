# HANDOVER

Read first: ARCHITECTURE.md, CONSTRAINTS.md. Update this file at the end of every session (newest on top).

## Latest session: 2026-10-26 (model: claude-opus-5-5)
Done:
- Marketing hub: 48 skills + 6 hub-* pipelines, CLAUDE.md, brand template (commit 8f3bc5b on branch marketing-hub)
- Brand singha-tax-consultants onboarded; full report (reports/brand-report-2026-10-26.md/.html)
- AI Marketing Office (office/): server, 5 agents, approval gate, leads, routines, UI, 11 passing tests, one real Claude CLI smoke run (manager agent, 18 s)
- Engineering docs from the "Defend What You Ship" guide (this folder)
In progress:
- Singha: owner to choose the goal date (31 Mar vs 31 Jul 2027) before /hub-strategy
Broken or risky:
- Drafts stay "Generating" if the server restarts mid-run (FAILURE.md)
- Repo is PUBLIC; brand data (budget, goals, strategy) is committed locally but not pushed. Owner decision pending
Next:
- /hub-strategy singha-tax-consultants once the goal date is decided
- Office: recovery sweep on startup; optional Telegram notifier (D-002)
Do not touch:
- Approval gate, lead source rule, runner tool lists, CSP, without a DECISIONS entry (CONSTRAINTS.md)
