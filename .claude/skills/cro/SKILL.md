---
name: cro
description: "Optimize conversion rates on pages and forms with a structured audit and prioritized fixes. Use when a page, funnel or form underperforms."
---

# cro · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `01-intel/marketing-psychology`
- `data/ (analytics, heatmaps)`

## Process
1. Define the page's single conversion goal and current rate (from `data/` [Data] or ask).
2. Audit with the LIFT model: **Value proposition** clarity · **Relevance** to traffic source · **Clarity** of layout · **Anxiety** (trust, risk) · **Distraction** · **Urgency**.
3. Check: above-the-fold message, CTA visibility and wording, form fields (cut every unnecessary field), social proof placement, page speed, mobile layout, trust signals near CTAs.
4. Prioritize fixes with PIE (Potential, Importance, Ease).

## Output
Annotated audit (section · issue · fix), PIE-scored fix list, rewritten hero/CTA, and the top 3 tests to hand to `/ab-testing`.

## Save
- Write to `brands/<slug>/07-analytics/cro-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · cro · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
