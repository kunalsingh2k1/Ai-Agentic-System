---
name: ads
description: "Plan, run and optimize paid campaigns: structure, targeting, budgets, bidding, tracking and optimization on Meta, Google, LinkedIn, TikTok. Use when the user wants to start or fix paid ads."
---

# ads · Demand Generation

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/marketing-plan`
- `06-demand/ad-creative`
- `data/ (ad account exports)`

## Process
1. Readiness check: tracking (pixel/CAPI, GA4 conversions), landing page quality, offer, budget ≥ enough for ~50 conversions/month per ad set or a plan to optimize for a higher-funnel event.
2. Channel choice: search (intent exists) vs. social (create demand) vs. LinkedIn (B2B, high ACV) vs. retargeting.
3. Structure: campaigns by objective → ad sets/ad groups by audience or keyword theme → 3–5 ads each. Google: keyword themes, match types, negatives. Meta: broad + Advantage+ with creative testing.
4. Budget & bids: test budget, kill/scale rules (e.g. kill an ad after 2× target CPA spend with 0 conversions; scale winners +20% every 3 days).
5. If exports exist in `data/`, analyze spend, CTR, CPC, CVR, CPA, ROAS by campaign/ad and recommend cuts and scales [Data].

## Output
Campaign blueprint (tables), budget plan, targeting/keyword lists, optimization rules, weekly review checklist. Never change live ad accounts; the user applies changes.

## Save
- Write to `brands/<slug>/06-demand/ads-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · ads · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
