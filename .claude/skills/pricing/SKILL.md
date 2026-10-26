---
name: pricing
description: "Improve pricing, packaging and monetization: tiers, value metric, anchoring, discounts. Use when setting or changing prices or plans."
---

# pricing · Strategy & Positioning

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `01-intel/competitor-profiling`

## Process
1. Find the **value metric** (what grows as the customer gets more value: seats, orders, usage, outcomes).
2. Benchmark competitor prices and packaging (table).
3. Design 3 tiers (good / better / best) with a clear "who it's for" each; put the target plan in the middle; use the top tier as an anchor.
4. Decide discounts policy (annual %, launch, nonprofit), free plan/trial strategy and price-increase plan for existing customers.
5. Willingness-to-pay check: Van Westendorp 4-question survey draft.

## Output
Pricing page recommendation (tier table with names, prices, limits, feature fences), rationale, risks, and a rollout/test plan.

## Save
- Write to `brands/<slug>/02-strategy/pricing-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · pricing · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
