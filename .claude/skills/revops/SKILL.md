---
name: revops
description: "Improve lead lifecycle and marketing-to-sales handoff: lead stages, scoring, routing, CRM hygiene and funnel reporting. Use when leads are lost between marketing and sales."
---

# revops · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `07-analytics/analytics`
- `01-intel/prospecting`

## Process
1. Lifecycle stages with clear entry criteria: Subscriber → Lead → MQL → SQL → Opportunity → Customer → Advocate.
2. Lead scoring: fit (ICP match) + behavior (pricing page visit, demo request, email engagement), with thresholds.
3. Routing & SLA: who gets which lead, response time target (e.g. < 1 hour for demo requests), follow-up cadence.
4. CRM hygiene: required fields, source tracking (UTMs into CRM), dedupe rules.
5. Funnel report: conversion and velocity by stage and by source.

## Output
Lifecycle definition table, scoring model, routing/SLA rules, CRM field list, funnel dashboard spec, handoff checklist.

## Save
- Write to `brands/<slug>/08-ops/revops-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · revops · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
