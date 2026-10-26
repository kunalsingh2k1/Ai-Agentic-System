# Constraints: hard rules for humans and AI working on this repo

- **Never** let any agent post, send, publish, spend or delete. Agents draft; the owner acts. No integration that sends messages without a human click.
- **Never** give office agents write tools. Agents return JSON and the server writes it after validation. Research gets only `WebSearch, WebFetch`; the others get no tools.
- **Never** store a lead without a public `sourceUrl`. Every new lead is "Needs human verification". Outreach only for Verified leads that aren't "Do not contact".
- **Never** auto-retry a failed agent run, except the single retry for unreadable JSON. Failures stay visible as "Failed".
- **Never** insert AI or brand text into the UI as HTML. Use text nodes; the Markdown renderer escapes first.
- **Never** serve files from `brands/*/data/` (private exports) or outside a brand folder.
- **Never** commit secrets. The office has none except an optional `OFFICE_TOKEN` env var. No Anthropic API key: runs use the owner's Claude plan through the CLI.
- **Always** keep the office zero-dependency (node: built-ins only). Adding a package needs a DECISIONS entry.
- **Always** bind to 127.0.0.1 unless `HOST` is set deliberately; set `OFFICE_TOKEN` before exposing it on any network.
- **Always** run `npm test` in `office/` and paste the real output before calling a change done.
- **Ask first** before changing the approval gate, lead rules, the runner's tool lists or the CSP.
