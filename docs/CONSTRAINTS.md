# Constraints: hard rules for humans and AI working on this repo

- **Never** let any agent post, send, publish, spend or delete. Agents draft; the owner acts. No integration that sends messages without a human click.
- **Only the Skill Worker edits files**, and only inside its own `brands/<slug>/` folder: `--restricted` mode, deny rules for `office/` and `data/`, snapshot + Keep/Undo review on every run (D-009). It gets no Bash or other command tools, and no write access to code, skills or other brands. All other agents return JSON that the server validates. Research gets only `WebSearch, WebFetch`.
- **Never** store a lead without a public `sourceUrl`. Every new lead is "Needs human verification". Outreach only for Verified leads that aren't "Do not contact".
- **Never** auto-retry a failed agent run, except the single retry for unreadable JSON (never for edit agents). Failures stay visible as "Failed"; a failed plan step stops the plan.
- **Never** insert AI or brand text into the UI as HTML. Use text nodes; the Markdown renderer escapes first.
- **Never** serve files from `brands/*/data/` (private exports) or outside a brand folder.
- **Never** commit secrets. The office has none except an optional `OFFICE_TOKEN` env var. No Anthropic API key: runs use the owner's Claude plan through the CLI.
- **Always** keep the office zero-dependency (node: built-ins only). Adding a package needs a DECISIONS entry.
- **Always** bind to 127.0.0.1 unless `HOST` is set deliberately; set `OFFICE_TOKEN` before exposing it on any network.
- **Always** run `npm test` in `office/` and paste the real output before calling a change done.
- **Never** run an Orchestrator plan without the owner's approval of that plan.
- **Never** commit `skills-library/` (third-party skills; re-create with `npm run sync-skills`).
- **Ask first** before changing the approval gate, lead rules, the runner's tool lists or deny rules, the snapshot/undo, or the CSP.
