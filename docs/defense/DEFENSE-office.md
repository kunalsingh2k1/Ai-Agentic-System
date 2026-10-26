# DEFENSE: AI Marketing Office

**What it does:** A local web office where AI agents plan tasks, draft marketing content and outreach, and research public business leads for each brand in the hub, while a human approves everything before it leaves the building.

**How it works:** Browser → `server.mjs` (validation, CSRF guard) → `office.mjs` workflow → `runner.mjs` spawns `claude -p` with per-agent tools in a temp dir → JSON reply → `agents.validate()` → `store.mjs` writes `brands/<slug>/office/*.json`. Drafts always pass the Quality Checker and wait in "Awaiting approval". Approval writes the final text into the brand folder for manual posting.

**Key decisions (why X over Y):** Claude CLI over n8n+Ollama (quality, already installed, no key) · web UI over Telegram (long text and tables; phone access later) · JSON files over Sheets/DB (zero setup, tiny volumes) · zero dependencies (supply chain) · deterministic report (can't invent progress). Details in DECISIONS.md.

**Data structures:** Per-brand arrays of records with prefixed IDs (T-/D-/L-/R-/G-/W-). Read whole, rewritten atomically through a per-file promise queue. Fits small volumes and single-process use. Drafts keep `versions[]` and `history[]` as the audit trail.

**Abuse:** CSRF blocked by header + JSON preflight · prompt injection contained (no write tools, whitelist validation, human verification of leads, text-only rendering) · path traversal blocked · CSV formula injection escaped · cost capped daily. Gaps: DNS rebinding without a token, token stored in the browser. See THREAT.md.

**Where it fails:** CLI missing, slow or over its limit → visible "Failed" drafts, never silent. Restart mid-run → stuck "Generating" (no recovery sweep yet). Two processes → lost writes. See FAILURE.md.

**With another week:** recovery sweep for stuck runs on startup · Telegram notifications · Host-header allow-list · Playwright UI tests · per-brand cost dashboard.
