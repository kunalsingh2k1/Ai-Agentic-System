# HANDOVER

Read first: ARCHITECTURE.md, CONSTRAINTS.md. Update this file at the end of every session (newest on top).

## Latest session: 2026-10-27 (b) (model: claude-opus-5-5)
Done:
- skills-library: 973 skills (919 personal + 54 hub) via office/scripts/sync-skills.mjs (git-ignored)
- Agents use skills: the Manager and Orchestrator pick from the library; the Content Agent and the new Skill Worker get the skill's SKILL.md + references
- Skill Worker edits files in brands/<slug>/ (restricted, office/data denied, snapshot + Keep/Undo); verified with the real CLI
- Orchestrator: goal → plan → owner approval → ordered steps (worker/research/content), resume on failure
- 16 tests passing
Next:
- Owner reviews the first real worker run (T-0007 flyer) in Approvals → File changes

## Session: 2026-10-27 (a) (model: claude-opus-5-5)
Done:
- /hub-strategy for singha-tax-consultants: voice guide, messaging, offers, loops, 22-week plan, one-page summary; SCORECARD targets; 10 tasks seeded into the office (T-0001..T-0010)
In progress:
- Owner to set the ⚠ offer prices and get CA Prateek's ICAI sign-off on offers, guarantee and referral wording
Broken or risky:
- Repo still PUBLIC; nothing pushed. gh token can't change visibility (403); owner must switch to private in GitHub settings
Next:
- /hub-content singha-tax-consultants (calendar + first week's posts), then weekly /hub-grow; Gate 1 on 30 Nov

## Session: 2026-10-26 (model: claude-opus-5-5)
Done:
- Marketing hub: 48 skills + 6 hub-* pipelines, CLAUDE.md, brand template (commit 8f3bc5b on branch marketing-hub)
- Brand singha-tax-consultants onboarded; full report (reports/brand-report-2026-10-26.md/.html)
- AI Marketing Office (office/): server, 5 agents, approval gate, leads, routines, UI, 11 passing tests, one real Claude CLI smoke run (manager agent, 18 s)
- Engineering docs from the "Defend What You Ship" guide (this folder)
Broken or risky:
- Drafts stay "Generating" if the server restarts mid-run (FAILURE.md)
- Repo is PUBLIC; brand data (budget, goals, strategy) is committed locally but not pushed. Owner decision pending
Next:
- /hub-strategy singha-tax-consultants once the goal date is decided
- Office: recovery sweep on startup; optional Telegram notifier (D-002)
Do not touch:
- Approval gate, lead source rule, runner tool lists, CSP, without a DECISIONS entry (CONSTRAINTS.md)
