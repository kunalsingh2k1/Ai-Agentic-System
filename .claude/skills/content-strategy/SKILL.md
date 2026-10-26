---
name: content-strategy
description: "Plan content pillars, topics, formats and distribution aligned to business goals. Use when the brand needs a content strategy for blog, social, video or newsletter."
---

# content-strategy · Content & Editorial

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `02-strategy/brand-positioning`
- `03-seo/keyword-research`

## Process
1. Content goal per funnel stage (awareness, consideration, conversion, retention) and the metric for each.
2. 3–5 **content pillars** where customer pains × brand expertise × search/social demand overlap.
3. For each pillar: hero pieces (big, linkable), hub pieces (regular SEO/educational), hygiene pieces (FAQs, quick tips).
4. Repurposing system: 1 hero piece → 1 blog + 1 video + 5 short clips + 8 social posts + 1 newsletter + 1 carousel.
5. Distribution: owned, earned, paid; which channels get which formats.

## Output
Content strategy doc: goals, pillars (with 10 topic ideas each), format mix, repurposing flow, cadence realistic for the team, distribution checklist, KPIs.

## Save
- Write to `brands/<slug>/04-content/content-strategy-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · content-strategy · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
