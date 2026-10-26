# AI Marketing Office

The "AI Digital Office" (task intake → AI drafts → quality check → **your approval**, plus ethical lead research and daily reports) built on top of the marketing hub. It's a local web app that works on every brand in `brands/`.

## Start
```
cd office
npm start          # real agents via the Claude Code CLI on your plan
npm run demo       # demo mode: canned AI answers, no AI usage
npm test           # 16 workflow tests (no AI usage)
npm run sync-skills  # copy your personal Claude skills into ../skills-library
```
Open http://127.0.0.1:4317. In Codespaces, open the **Ports** tab and click the globe icon on port 4317. Keep the port **private**.

## What's inside
| Page | What you do there |
|---|---|
| **Today** | Counts, daily report (built from data, never invented), the next hub command to paste in Claude Code |
| **Orchestrator** | Give a goal. It plans 2–8 steps using skills from your library; you approve the plan, then the steps run in order (files, leads, drafts) |
| **Ask the Manager** | Type a request; the AI Manager splits it into 1–5 tasks for the Content, Research or Follow-up agent, or for you |
| **Tasks** | Board: Pending → In Progress → Blocked → Done. "Draft with AI" per task |
| **Approvals** | Every draft, with the Quality Checker's verdict. Approve / Revise (with feedback) / Reject / Use suggested version. Approved text is saved to `brands/<slug>/04-content/approved/` |
| **Leads** | Web research for local businesses (source URL required), verification queue, contact status incl. "Do not contact", outreach drafts for verified leads only, weekly routines |
| **Skills** | All 973 skills (54 hub + your personal Claude skills): search, preview, run one for the brand, or re-sync from your Claude account |
| **Brand & reports** | brand.md, every report and deliverable the hub produced (HTML reports render sandboxed) |
| **Activity** | Every AI run: agent, duration, result, error |

Export any table as CSV for Google Sheets.

## Settings (environment variables)
| Variable | Default | Meaning |
|---|---|---|
| `PORT` / `HOST` | 4317 / 127.0.0.1 | Where it listens. Set `OFFICE_TOKEN` before using any other host |
| `OFFICE_TOKEN` | none | Access token the UI asks for once |
| `OFFICE_RUNNER` | claude | `mock` = demo mode |
| `OFFICE_DAILY_RUN_LIMIT` | 40 | Hard cap on AI runs per day |
| `OFFICE_MODEL` | CLI default | e.g. `claude-sonnet-5-5` for cheaper, faster runs |
| `CLAUDE_BIN` | auto-detected | Path to the `claude` CLI (found on PATH or in the VS Code extension) |

## Agents that edit files
The **Skill Worker** follows a skill and saves its output straight into `brands/<slug>/`. It can't run commands, can't leave that folder, and can't touch `data/` or the office database. Every run is snapshotted; review it under **Approvals → File changes** and keep it or undo it all.

## Rules it enforces
Nothing is posted, sent or paid for by the office. Only the Skill Worker writes files (confined, reviewable, undoable). The other agents' JSON is validated by the server. Leads need a public source and human verification before outreach. Failed runs are shown, not silently retried. Engineering docs: `../docs/`.
