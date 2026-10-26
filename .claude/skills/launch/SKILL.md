---
name: launch
description: "Plan product launches and announcements: pre-launch, launch day and post-launch across channels. Use for new products, features, stores, locations or rebrands."
---

# launch · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `04-content/content-calendar`

## Process
1. Launch tier: **Tier 1** (major, all channels), **Tier 2** (notable feature, owned channels), **Tier 3** (small, changelog/social).
2. Phases: pre-launch (−6 to −1 weeks: waitlist, teasers, beta users, press/partner briefing, assets), launch day (hour-by-hour run sheet), post-launch (weeks 1–4: follow-ups, case studies, retargeting, retro).
3. Channel plan: email, social, community (Product Hunt, Reddit, LinkedIn), PR, partners, ads, website changes, in-app.
4. Asset checklist with owners.

## Output
Launch plan with timeline table, run sheet, asset checklist, announcement copy drafts (email, social posts, Product Hunt tagline/description, press blurb), success metrics.

## Save
- Write to `brands/<slug>/08-ops/launch-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · launch · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
