---
name: paywalls
description: "Optimize paywalls, upgrade screens, trial-to-paid conversion and feature gates. Use for SaaS, apps, memberships and freemium products."
---

# paywalls · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/pricing`
- `07-analytics/signup`

## Process
1. Map upgrade moments: hitting a limit, using a premium feature, end of trial, success moment.
2. Gate design: what's free vs paid (free must deliver real value; paid unlocks scale/speed/outcome), soft vs hard walls, reverse trial option.
3. Paywall screen: outcome headline, 3 benefits, plan toggle (annual preselected with savings shown), social proof, trust (cancel anytime), one primary CTA.
4. Trial emails/in-app messages for days 1, 3, 7, last-2-days, expiry.

## Output
Upgrade-moment map, gating recommendations, paywall copy and layout, trial messaging sequence, metrics (trial start rate, trial-to-paid, upgrade rate).

## Save
- Write to `brands/<slug>/07-analytics/paywalls-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · paywalls · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
