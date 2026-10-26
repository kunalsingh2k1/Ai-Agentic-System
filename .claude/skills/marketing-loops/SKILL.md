---
name: marketing-loops
description: "Design repeatable, self-running growth loops (content, viral, paid, sales loops) instead of one-off campaigns. Use when the brand needs compounding growth."
---

# marketing-loops · Strategy & Positioning

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `07-analytics/analytics`

## Process
1. Identify candidate loops:
   - **Content/SEO loop**: content → search traffic → users → user-generated content/data → more content
   - **Viral/referral loop**: user → invites/shares → new user
   - **Social loop**: customer results → posts/UGC → audience → customers
   - **Paid loop**: ad spend → customers → profit → more ad spend (works if LTV:CAC ≥ 3)
   - **Sales loop**: customers → case studies → pipeline
2. For each, draw the cycle (Mermaid diagram), name the input, action, output, and how output feeds input.
3. Estimate loop speed (cycle time) and gain (output per input). Pick the one with the best gain × feasibility.

## Output
Loop diagrams, scoring table, the chosen loop's build plan (what to ship, metrics per step, where it leaks).

## Save
- Write to `brands/<slug>/02-strategy/marketing-loops-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · marketing-loops · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
