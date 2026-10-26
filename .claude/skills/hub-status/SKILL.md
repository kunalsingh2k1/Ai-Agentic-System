---
name: hub-status
description: "Show every brand in the marketing hub: profile completeness, pipeline stage, last activity and next recommended step. With a brand slug as argument, switch the active brand. Use when the user asks 'which brands', 'status', 'switch to <brand>'."
---

# hub-status · all brands at a glance

1. If `$ARGUMENTS` names a brand folder, write that slug to `brands/.active` and confirm the switch.
2. For each folder in `brands/` that doesn't start with `_`:
   - Profile completeness: share of `brand.md` fields that aren't TODO or empty
   - Pipeline stage: Onboarded → Reported (has `reports/brand-report-*`) → Strategy (has `02-strategy/strategy-summary-*`) → Content (has `04-content/posts/`) → Growing (has `07-analytics/weekly-review-*`)
   - Last activity: the last line of `LOG.md`
   - Latest scorecard status (🟢🟡🔴 counts), if any
   - Next step: the next pipeline command, or `/hub-grow` if a review is more than 7 days old
3. Reply with one table (active brand marked ★), then a one-line nudge for each brand that is stale (no activity in 14+ days).

If there are no brands yet, explain how to start: paste brand details or a website and run `/hub-onboard`.
