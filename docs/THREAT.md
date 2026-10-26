# Threat model: AI Marketing Office

| Actor / entry point | Worst realistic abuse | Mitigation in place | Known gap |
|---|---|---|---|
| Anonymous web page in the owner's browser (CSRF) | Submits forms to `localhost:4317` to approve drafts or burn AI runs | Mutations need `X-Office: 1` + `application/json`, which force a CORS preflight the server never answers → refused | DNS rebinding could make requests same-origin. Mitigate with `OFFICE_TOKEN`; Host-header allow-list not implemented |
| Anyone on the network | Uses the office if it's exposed | Binds to 127.0.0.1 by default; optional `OFFICE_TOKEN` | Token sits in localStorage and in the iframe URL for reports |
| Malicious web page read by the research agent (prompt injection) | Tells the agent to output fake leads, links or instructions | Agent has only WebSearch/WebFetch, no write tools, temp cwd, no MCP; output whitelisted by `normaliseLead`; leads start unverified; UI renders text only; links limited to http(s) with `rel=noopener` | A convincing fake lead can still reach the verification queue. The human check is the control |
| Model output (any agent) | Invalid/oversized JSON, script tags in a draft | `validate()` clamps lengths and enums; drafts are shown as text; CSP `script-src 'self'` | — |
| Brand files (reports written by skills) | HTML with scripts | Served with `CSP: sandbox; default-src 'none'` inside a `sandbox` iframe | — |
| Path tricks in `?path=` | Read files outside the brand, or private `data/` exports | `path.resolve` + relative check, extension allow-list, `data/` and `office/` blocked; tested | — |
| CSV export opened in Sheets/Excel | Formula injection (`=HYPERLINK(...)`) from scraped text | Cells starting `= + - @` are prefixed with `'`; tested | — |
| Cost abuse (loops, routines) | Unbounded model calls | Daily run cap (429), 2 concurrent, timeouts with SIGKILL | Cap resets on restart |
| Insider / owner mistake | Sending outreach to people who opted out | "Do not contact" status blocks outreach drafts; no send capability exists | Status is manual |
| ANTHROPIC_API_KEY in env | Runs bill an API account unexpectedly | Startup warning | Not stripped from the child env |
