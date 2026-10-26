---
name: analytics
description: "Improve tracking and measurement and produce analytics reports: KPIs, GA4 events, UTMs, dashboards, attribution, performance analysis. Use when setting up tracking or analyzing marketing data."
---

# analytics · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/marketing-plan`
- `data/ (any exports)`

## Process
1. **Analyze data first** if `data/` has exports (GA4, Search Console, social insights, ads, Shopify/Stripe, email). Use Python/pandas when helpful. Compute trends (period over period), channel contribution, funnel conversion rates, top content, anomalies. All findings tagged [Data].
2. **KPI tree**: north star → input metrics per funnel stage → channel metrics.
3. **Tracking plan**: GA4 events + key events (sign_up, generate_lead, purchase, etc.) with parameters, UTM convention (`utm_source/medium/campaign/content`, lowercase), pixel/CAPI, call tracking if relevant, consent mode.
4. **Dashboard spec**: weekly scorecard (metric, this week, last week, target, status).

## Output
Performance analysis (if data), KPI tree, tracking plan table, UTM builder rules, dashboard spec, and "what to measure weekly vs monthly".

## Save
- Write to `brands/<slug>/07-analytics/analytics-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · analytics · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
