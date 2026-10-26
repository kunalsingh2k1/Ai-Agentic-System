---
name: marketing-plan
description: "Build a complete marketing plan: goals, audiences, channels, budget, timeline and KPIs. Use when the user asks for a plan, strategy or roadmap for a brand."
---

# marketing-plan · Strategy & Positioning

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `all of 01-intel and 02-strategy`
- `07-analytics/analytics`

## Process
1. Goal: one north-star metric + target + date (from `brand.md`). Break into funnel targets working backward (visits → leads → customers) using benchmark or actual conversion rates.
2. Pick 2–3 **primary channels** (ICE score every candidate: Impact, Confidence, Ease, 1–10) and 1–2 experiments. Say no to the rest explicitly.
3. For each primary channel: objective, tactics, cadence, owner, budget, KPI.
4. 90-day roadmap in 3 phases: **Foundation** (weeks 1–4: tracking, positioning, key pages), **Traction** (5–8), **Scale** (9–12).
5. Budget split and expected return (show assumptions).

## Output
Executive summary (5 bullets) · goals & funnel math · channel scorecard · 90-day roadmap (week-by-week table) · budget · KPI dashboard spec · risks · first 10 tasks for this week.

## Save
- Write to `brands/<slug>/02-strategy/marketing-plan-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · marketing-plan · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
