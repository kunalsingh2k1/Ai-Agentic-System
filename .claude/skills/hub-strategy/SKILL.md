---
name: hub-strategy
description: "Build a brand's full strategy and plan: positioning, messaging, voice, offer, growth loop and a 90-day marketing plan with KPIs. Use after /hub-report, or when the user asks for a strategy, plan or roadmap."
---

# hub-strategy · strategy and 90-day plan

Brand: `$ARGUMENTS`, else `brands/.active`. Read `brand.md` and the latest `reports/brand-report-*.md`. If there's no report, warn the user that the strategy will rest on assumptions, and offer to run `/hub-report` first.

## 1. Run the strategy skills
Run each with the Skill tool, or by following its SKILL.md. Reuse outputs less than 30 days old.

1. `brand-positioning`: brand voice guide
2. `product-marketing`: messaging framework
3. `offers`: only if the report flagged offer or conversion as weak
4. `pricing`: only if pricing is in question or the brand is new
5. `marketing-loops`
6. `marketing-plan`: 90-day plan built on everything above

If there's a genuine strategic fork (for example, Instagram-first versus SEO-first, or premium versus volume), run `marketing-council` on it and record the verdict in `DECISIONS.md`.

## 2. Strategy summary
Save `brands/<slug>/02-strategy/strategy-summary-<YYYY-MM-DD>.md`. Keep it to one page, so the owner can read it in 3 minutes:
- Positioning statement and value prop
- Who we target first (segment) and why
- The 2–3 channels we commit to, and what we say no to
- North-star goal, funnel targets, monthly milestones
- 90-day roadmap at a glance (Foundation / Traction / Scale)
- Budget split
- KPI targets table (metric · baseline · 30-day · 60-day · 90-day): this seeds `SCORECARD.md`
- This week's first 10 tasks, with owner and the skill that helps

Also write the KPI targets into the header of `SCORECARD.md`.

## 3. Finish
Append to `LOG.md`. Reply with the summary and: "Next: `/hub-content <slug>` to produce the first month of content."
