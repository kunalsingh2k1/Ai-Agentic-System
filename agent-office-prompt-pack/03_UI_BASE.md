# 03 · UI base — "Signal Board"

Same jobs as the reference office UI (see what's live, tell agents what to do, approve changes, follow the timeline, plan routines) but a **different look and metaphor**. Do not copy the reference: no isometric floor, no robots, no conveyor belt, no parcels, no navy/cream palette, no condensed signage font.

**Metaphor:** a rail-signalling control room. Each department is a **track**. Each task is a **token** that moves left → right through **stations**: `Queued → Working → Needs you → Writing → Done`. The approval station is a **signal** that stays amber until a human clears it. Failed/rejected tokens drop to a **siding** below the track.

## 1. Stack
React 18 + Vite + TypeScript, Radix primitives (Dialog, DropdownMenu, Popover, Tooltip, Tabs), plain CSS with custom properties (no Tailwind), SVG for the board. Build to a single self-contained HTML (`vite-plugin-singlefile`) **plus** a **demo mode**: when `?demo=1` or no server answers, an in-browser mock of §6 of `02_CLAUDE_INTEGRATION.md` (fetch + EventSource shim, seeded tasks that move every second) so the UI can be shown or published without the backend.

## 2. Tokens (define on `:root`; dark under `[data-theme=dark]` and `prefers-color-scheme`)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f4f5f7` | `#101214` |
| `--surface` | `#ffffff` | `#181b1f` |
| `--surface-2` | `#eceef1` | `#20242a` |
| `--line` | `#d5d9df` | `#2c3239` |
| `--text` | `#15181c` | `#eef1f4` |
| `--text-2` | `#4a525c` | `#b4bcc6` |
| `--text-3` | `#6b7480` | `#8a94a0` |
| `--accent` (primary action, focus) | `#0f766e` | `#2dd4bf` |
| `--accent-ink` | `#ffffff` | `#06201d` |
| `--sig-working` | `#2563eb` | `#7aa7ff` |
| `--sig-needs` (amber signal) | `#b45309` | `#fbbf24` |
| `--sig-done` | `#15803d` | `#4ade80` |
| `--sig-failed` | `#b91c1c` | `#f87171` |
| `--sig-queued` | `#6b7480` | `#8a94a0` |
| `--dept-0…--dept-7` | 8 categorical hues, checked ≥ 3:1 against `--surface` in both themes |

Type: **IBM Plex Sans** (UI, 15px/1.5 base), **IBM Plex Mono** (refs, times, tool names, numbers). Headings Plex Sans 600, sentence case — no all-caps signage. Radius 6 / 10 / 14. Spacing 4-pt scale. Controls 44px tall (40px min on phone). Motion 150–200 ms ease-out; everything static under `prefers-reduced-motion`.

Status never relies on colour alone: every status has an icon + word (`● Working`, `◆ Needs you`, `▲ Failed`, `✓ Done`, `○ Queued`, `‖ Held`).

## 3. Layout (desktop ≥ 1200px)

```
┌ Top bar ─────────────────────────────────────────────────────────────────────────┐
│ <Short name> Signal Board  [ENV]   ● 5/6 systems   [Search or command  ⌘K]       │
│                                   [ Run | Pause | Stop ]  Needs you (3)  10:42  ⋯ │
├──────────────┬───────────────────────────────────────────────┬───────────────────┤
│ TRACKS       │  BOARD                                        │  SEND WORK         │
│ ▸ Sales   ●2 │  Queued   Working   ◆Signal   Writing   Done   │  Agent [Auto ▾]    │
│   12 open SO │  ─○──○────●─────────◆────────────────────✓──  │  [what to do…]     │
│ ▸ Purchasing │  ─────────●───────────────────●──────────✓✓─  │  📎 Attach  ☐ Hold │
│ ...          │  siding: ▲ Bill 88213 (failed)                │  [Send]            │
│ VAULT        ├───────────────────────────────────────────────┤  ───────────────── │
│ 63 notes     │  ACTIVITY  (collapsible, newest first)        │  [Needs you|Active|│
│ last read …  │  10:41 PO Builder  read SOP - Create PO       │   Queued|Done|Fail]│
│ PROJECTS 54% │  10:40 Dispatcher  → PO Builder (Purchasing)  │  task cards…       │
└──────────────┴───────────────────────────────────────────────┴───────────────────┘
```
- Left rail and right panel are resizable (drag, double-click resets) and collapsible to icon strips; widths remembered per browser (localStorage in try/catch).
- 760–1199px: rail becomes a `<details>` strip above the board; right panel stays.
- < 760px: three tabs **Board · Tasks · Tracks**; Needs-you count badge on Tasks; drawer becomes full-screen sheet.

## 4. Components

| Component | Behaviour |
|---|---|
| **Track** (one per department) | Lane with dept colour edge, agent stops on the left (initials chip with live dot). Tokens sit at their station; hover = tooltip (title, agent, age); click = drawer. Several tokens at one station stack with a `+n` counter. |
| **Signal** | Amber diamond at the approval station; pulses slowly while anything waits. Click → filters queue to that track's approvals. |
| **Route line** | When a task moves, a 300 ms dashed line animates between stations; the Dispatcher's routing shows as a line from the top "Dispatch" lane into the target track. |
| **Board controls** | Zoom +/–, fit, "Follow" toggle (auto-scrolls to whatever needs you), filter by clicking a track or station; Esc clears. |
| **Track card** (rail) | Name, live state, 2 KPIs with "as of", chips: queued / working / needs you. |
| **Send work** | Agent picker grouped by department (`Auto` first → Dispatcher), multiline text, attach (drag-drop; xls/doc refused with the fix in the message), entity picker when >1 entity, project picker (optional), **Hold until I press Start**. Shows "Sent" toast; offline → "Saved, waits for the office PC". |
| **Task card** | Status badge, title, agent · dept · entity · age, progress line while working ("Reading SOP - Create Purchase Order"), action buttons inline: Approve / Reject (needs_approval), Answer (question), Start (held), Retry (failed/stopped/rejected), Stop (queued/working/writing), Mark checked (done writes). |
| **Drawer** (task detail) | Header (title, ref `T-1042`, agent, status); sections: Request (+ attachments), Question & answer, **Proposed change** table, Result (markdown render with tables), Confirmation, Files, Timeline (status, tool, vault reads, write calls, errors — tool names in mono), Approval history. |
| **Approve dialog** | Title "What Approve will do", eyebrow "Writes to <system> · <entity>", key/value fields, list of changes, "<n> write(s)", note "Nothing is changed until you approve." Buttons: Cancel · **Approve and write**. Reject asks for an optional reason. |
| **Activity feed** | Time · agent · plain sentence; tool rows in mono; click → drawer. |
| **Calendar** (full-screen view) | Month/week toggle, routines list on the left (title, agent, time, repeat, "needs OK" badge), chips on days, click a day → create routine popover (agent, text, time, repeat, weekday/month day, needs OK, model). Shows past runs with their status. |
| **Projects** (full-screen view) | Projects list with % bar (`v_project_progress`); board columns `To do · Doing · Blocked · Review · Done` for work items; milestone strip with due dates; an item can be **sent to an agent** (creates a linked task). |
| **Command palette** (⌘K / Ctrl K) | Jump to task by ref/title, switch track, open calendar/projects, run/pause, theme. |
| **System popover** | Connector list (ok/detail/checked at), vault notes count, last note read, model, office mode. |

Keyboard: `⌘K` palette · `N` new task · `A` approve focused · `R` reject · `J/K` next/prev card · `G B / G C / G P` go board/calendar/projects · `?` shortcuts.

## 5. States (design every one)
Loading = skeleton cards and grey track lines; empty = one sentence + one action ("Nothing needs you" / "Send work to an agent"); offline banner; read-only role (buttons hidden, not disabled); office paused banner ("Tasks you add wait in the queue until you press Run"); usage-limit banner; error toast with the server's sentence and a Retry.

## 6. Copy rules
Plain words, sentence case, no jargon in the UI ("Needs you", not "pending_approval"). Times in the workspace timezone with the zone shown once in the top bar. Money with the workspace currency. Never show raw JSON outside the Timeline's expandable rows.

## 7. Done means
- Live updates only via SSE; reconnect resumes with `Last-Event-ID`.
- Lighthouse accessibility ≥ 95; full keyboard path through send → approve; visible focus ring (`--accent`).
- Playwright: screenshots desktop 1440, tablet 900, phone 390 × light/dark; flows: send task, approve, reject with note, answer question, start held task, retry failed, create routine, move a work item.
- No horizontal scroll at 390px; 16px side gutters on phone.
