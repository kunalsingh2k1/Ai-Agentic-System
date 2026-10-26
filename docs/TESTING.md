# Testing & rollback

## Automated (must pass before any change counts as done)
```
cd office && npm test
```
Pass = `ℹ pass 11` / `ℹ fail 0`. The tests cover: manager → tasks, draft → QC → approve (file saved, task Done, LOG line), revise keeps versions, invalid-JSON retry then Failed, lead source rule + dedupe, outreach gating, daily cap, deterministic report, path traversal / private data, routine fires once per slot, CSRF guard, sandboxed reports, CSV formula escaping.

## Real-engine smoke check (costs one small run)
Start the server (`npm start`), open the UI → Ask the Manager → "Plan 2 Instagram posts about GST due dates". Expect tasks within ~30 s and a green "ok" run in Activity.

## Manual customer path (do after UI changes)
1. Today page loads the brand; health dot shows "Claude connected".
2. Tasks → Draft with AI → Approvals shows "Generating" then "Awaiting approval" with a QC verdict.
3. Revise with a note → a new version appears, and the old one is under "Earlier versions".
4. Approve → file appears in Brand & reports under 04-content/approved.
5. Leads → Find leads → rows arrive as "Needs human verification". "Draft message" stays disabled until Verified.
6. Brand & reports → open the HTML report (renders, no scripts).

## Rollback
- Code: every AI change is one commit. `git log --oneline`, then `git revert <sha>`. Last known good: tag after each green test run.
- Data: office data is plain JSON in `brands/<slug>/office/`. Restore from git or delete a file to reset that collection (e.g. `runs.json`).
- Kill switch: stop the server (Ctrl+C). Nothing runs without it, routines included.
