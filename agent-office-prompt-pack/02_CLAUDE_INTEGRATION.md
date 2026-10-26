# 02 · Integration — Claude ↔ database ↔ outside systems ↔ UI

## 1. Shape of the system

```
 Browser (UI, any device)
     │  HTTPS: REST + Server-Sent Events          (remote access via Cloudflare Tunnel or Tailscale)
     ▼
 Office server  (Node 22 + TypeScript, runs on the "office PC")
     ├─ API + SSE ............ §6
     ├─ Worker loop .......... claim_next_task() every 1 s
     ├─ Router ............... route_text() → LLM fallback
     ├─ Runner ............... spawns Claude Code CLI per phase (draft / write / answer)
     ├─ Scheduler ............ fire_due_routines() every 30 s
     ├─ Vault indexer ........ watches the markdown vault (read-only)
     └─ Notifier ............. chat pings for "needs you"
     │
     ├──► PostgreSQL (schema office)   LISTEN office → SSE fan-out
     └──► Claude Code CLI  ──►  MCP servers (ERP, email, chat, …)  +  Read tool on the vault folder
```

## 2. Claude access — subscription, no API key

- The runner drives the **Claude Code CLI in headless mode** (`claude -p`), signed in once on the office PC with the owner's Claude plan (`claude` → `/login`).
- **Never** set `ANTHROPIC_API_KEY` in the server environment — if present, the CLI bills the API instead of the plan. The server refuses to start if it is set (unless `ALLOW_API_KEY=1`).
- Before writing the runner, run `claude --version` and `claude --help` and build the argument list from what the installed version supports. Flags below are the expected ones; adapt names if the CLI differs and record it as a Decision in `PROJECT.md`.

### 2.1 Spawn per phase

```
claude -p "<phase prompt>"
  --output-format stream-json --verbose
  --model <task.model | agent.model>
  --mcp-config <runtime/mcp/<agent>.json> --strict-mcp-config
  --allowedTools "<Read> <read tools for draft | write tools for write>"
  --disallowedTools "Bash Edit Write WebFetch WebSearch <write tools during draft>"
  --add-dir <VAULT_PATH> --add-dir <runtime/tasks/<id>/in>
  --append-system-prompt "<agent.system_prompt + protocol §3>"
  --max-turns <agent.max_turns>
  [--resume <task.session_id>]          # write and answer phases continue the draft session
```

- `cwd` = `runtime/tasks/<task id>/` (inputs in `in/`, outputs written by the runner to `out/`).
- Kill the process after `agent.timeout_sec`; record `agent_run.exit_code`, turns, tokens.
- Parse stdout line by line (JSON). Map messages to `task_event`:
  - assistant `tool_use` → `tool` `{name}`; if it is `Read` on a path inside the vault → also `vault_read` `{note}`.
  - tool result with `is_error` → `tool_error` `{text}` (plain language, e.g. "ERP answered 429: too many requests").
  - assistant text blocks → `text` (trimmed; full text kept for the result).
  - final `result` message → session id saved to `task.session_id`.

### 2.2 MCP config per agent (generated at start-up)
`runtime/mcp/<agent>.json` contains only the connectors in `agent_connector` for that agent. Secrets are injected from the server's environment (`connector.secret_env`) when the file is written; the file is git-ignored and `chmod 600`.

## 3. Agent output protocol (appended to every system prompt)

~~~text
You are <agent.name> in the <department> department of <workspace.name>.
Follow these vault notes exactly, read them first: <agent_note titles, in order>.
The vault is read-only. Never edit files. Never send email or messages.
Entities you may act on: <entity names + external refs>. Default: <default entity>.

End your final message with exactly one of these blocks:

ACTION: DONE
<report in markdown; tables allowed>

ACTION: ASK
```json
{"prompt": "Which vendor is this invoice from?", "choices": ["Vendor A", "Vendor B"], "multi": false}
```

ACTION: PROPOSE
```json
{"action": "Create purchase order",
 "target": "<system> · <entity>",
 "fields": [["Vendor","…"],["Lines","14"],["Total","…"]],
 "changes": ["Create PO with 14 lines", "Flag 2 cost differences — rates kept as given"],
 "expected_writes": 1,
 "payload": {"tool": "create_purchase_order", "args": { … exact arguments … }}}
```
<human-readable draft: lines table, differences, assumptions>
~~~

Runner handling:

| Block | Task goes to | Also |
|---|---|---|
| `DONE` (agent cannot write) | `done` | `result_text`; if `makes_report`, update `kpi` rows from a `KPIS:` json line if present, set `as_of`, `source_task_id` |
| `DONE` (agent can write, but nothing to change) | `done` | — |
| `ASK` | `question` | insert `question`; notify |
| `PROPOSE` | `needs_approval` | insert `proposal` (version n+1); notify |
| missing / malformed | `failed` | error: "The agent did not finish with a clear result. Retry, or add detail." |

Routine tasks from writing agents never write on their own: they always stop at `needs_approval`.

## 4. Write phase (after Approve)

1. `approve_task()` → status `writing` (DB refuses without an approved proposal).
2. Spawn with `--resume <session>`; `--allowedTools` = only the write tool(s) named in the proposal payload (plus read tools needed to verify).
3. Prompt: *"Execute approved proposal v<n> exactly. No other changes. Then reply with the confirmation in the format from Rule - Confirmation Formats and `ACTION: DONE`."*
4. Each write `tool_use` → `write_call` row with `idempotency_key = <task id>:<proposal version>:<n>` **before** the call returns; result fills `response`, `ok`, `external_id`.
5. If writes exceed `expected_writes` → kill the process, status `failed`, error *"Stopped: the agent tried more changes than you approved."*
6. Any write error → `failed`, error *"The write stopped after <last ok write>. Check <system> before retrying."* **Never auto-retry a write.**
7. Success → `write_text` = confirmation, status `done`. The human can then press **Mark checked** (`checked_at`) after looking in the source system.

## 5. Routing (the Dispatcher/Orchestrator agent)
1. Task created with agent = `auto` → stored on the orchestrator agent.
2. `route_text(input)`; score > 0 → move to that agent, event `routed` `{text:"Dispatcher → PO Builder (Purchasing)"}`.
3. No match → one short Claude call (`--model haiku`, no tools) with the agent list (key, name, purpose) asking for JSON `{"agent":"<key>|none"}`.
4. `none` → `failed`: *"The Dispatcher could not pick an agent. Pick a department and send it again."*

## 6. Server API (the UI's only contract)

All JSON. Errors: `{ "error": "<plain sentence>" }` with 400/401/403/404/409.

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/me` | `{username, displayName, role}` |
| POST | `/api/login`, `/api/logout` | cookie session (httpOnly, SameSite=Lax) |
| GET | `/api/agents` | agents + dept + connectors + notes + canWrite |
| GET | `/api/tasks?status=&dept=&events=1` | newest first; `events=1` embeds timelines |
| POST | `/api/tasks` | `{agentId|"auto", text, attachments[], hold, entityId?, projectId?, threadId?}` |
| GET | `/api/tasks/:id` | task + events + proposal + question + files |
| POST | `/api/tasks/:id/{approve|reject|stop|retry|start|checked|answer|cancel-question|redraft}` | reject `{note}`; answer `{choices, text}` |
| GET | `/api/tasks/:id/files/:fileId` | download |
| POST | `/api/uploads` | multipart `file`; xlsx/docx converted to text for the agent; `.xls/.doc` refused with "save as .xlsx/.docx" |
| GET/POST | `/api/office`, `/api/office/{run|pause|stop}` | stop: working → queued, writing → stopped |
| GET/POST/PATCH/DELETE | `/api/routines[/:id]` | |
| GET | `/api/kpis`, `/api/status` | status = connectors ok/detail, vault counts, last note read, model, office mode |
| GET/POST/PATCH | `/api/projects[/:id]`, `/api/work-items[/:id]` | project management views |
| PUT | `/api/settings/model` | `{model, effort}` (owner/admin) |
| GET | `/api/stream` | SSE, see below |

**SSE `/api/stream`** — events: `hello`, `task` (full row), `event` (timeline row + taskId), `kpis`, `routines`, `office`, `status`. Heartbeat comment every 15 s. Support `Last-Event-ID` (task_event.id) so a reconnecting browser receives what it missed.

**Roles:** viewer = read; operator = create/stop/retry/answer/start; owner/admin = approve/reject, office controls, settings, routines. Approvals are logged in `audit_log`.

## 7. Other integrations

| Integration | How |
|---|---|
| ERP / accounting / inventory | MCP server(s) listed in `environment.yaml`; read tools in draft, write tools only after approval |
| Email | MCP; agents may **draft** only — no send tool is ever allowed |
| Team chat (Slack/Teams) | Notifier posts to the entity's channel: needs approval / question / failed, with a deep link `…/#task=<id>`. Daily digest at a set time. Financial documents go to the configured finance recipient. |
| Vault (Obsidian/markdown) | Folder on the office PC. Indexer hashes notes into `vault_note`; agents read via `Read` only; edits by humans in Obsidian |
| Files | Uploads stored under `runtime/uploads/`; outputs (xlsx, csv, pdf) under `runtime/tasks/<id>/out/` and registered in `task_file` |
| Spreadsheets (price sheets etc.) | Read through an MCP connector or a scheduled export into the vault `Ref/` folder |

## 8. Failure rules (plain-language messages, no stack traces in the UI)
- Connector down at start-up → `/api/status` shows it red; tasks for agents needing it stay `queued` with event `waiting` "Waiting for <connector>".
- Office PC offline → UI shows "The office PC is offline. Tasks you add wait until it is back."
- Rate limit / timeout in draft → one automatic retry after 60 s; in write → never.
- Claude usage limit reached → task back to `queued`, office auto-pauses, banner "Claude usage limit reached — resumes at <time>".

## 9. Tests
- Runner unit tests with recorded `stream-json` fixtures for: DONE, ASK, PROPOSE, malformed, tool error, too many writes.
- Integration test with a fake MCP server (read + write tools) and a fake `claude` binary on `PATH` that replays fixtures.
- One live test per agent in P3 with read-only tools.
