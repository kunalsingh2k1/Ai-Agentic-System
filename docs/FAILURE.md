# Failure map

| Dependency / limit | What if it is slow, down, wrong or empty | What happens | How you notice |
|---|---|---|---|
| Claude CLI missing | — | Runs fail as "Claude CLI not found…"; the UI health dot turns red | Sidebar health, Activity page |
| Claude CLI slow / hung | Timeouts: manager/QC 120 s, content 180 s, research 420 s | Process killed (TERM then KILL); draft "Failed" with a plain message | Activity shows the error and duration |
| Claude plan usage limit hit | CLI returns an error | Run "error", draft "Failed"; no automatic retry | Activity page |
| Model returns prose instead of JSON | — | One retry with a stricter instruction, then "Failed" | Draft error "No JSON object…" |
| QC agent fails | — | Draft still reaches "Awaiting approval", marked QC "unchecked" with the reason | Red QC border on the draft |
| Web search returns nothing / junk | — | Zero leads added; leads without sources dropped | Run ok, no new leads |
| Disk full / write error | Atomic rename never happens | Previous file stays intact; request returns a 500 message; the error is logged in the terminal | Terminal |
| Server restarts mid-run | Background job lost | Draft stuck in "Generating", run stuck "running" | **Gap:** no recovery sweep yet. Reject or re-request the draft |
| Two server processes | Concurrent whole-file writes | Possible lost update | **Gap:** single process only (D-003) |
| Daily cap reached | — | 429 "Daily AI run limit reached…" | Toast + sidebar counter |
| Growth | leads.json > ~5k rows | Slower whole-file writes (still fine at this size) | Revisit D-003 |
| Routines while the server is off | Slot missed | Runs once at the next tick after restart (one catch-up, not one per missed slot) | `lastRunAt` on the Leads page |
| Skill Worker times out (15 min) or errors mid-run | Partial files may exist | The diff still records every change it made; review shows them with Keep/Undo; the task is marked Blocked | Approvals → File changes |
| Worker returns no JSON | Not retried (could repeat edits) | Run "error", changes still listed for review | Same |
| Undo after the owner edited the file again | — | That file is skipped and reported as a conflict | Note on the run card |
| skills-library not synced (new machine) | — | Only the 54 hub skills are offered; Skills page says "not synced" | Skills page → "Sync from my Claude" |
| Plan step fails | — | Plan "Stopped" with the step's error; Resume re-runs only that step | Orchestrator page |
