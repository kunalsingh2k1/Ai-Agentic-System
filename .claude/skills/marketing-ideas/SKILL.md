---
name: marketing-ideas
description: "Generate campaign ideas, hooks and creative angles. Use when the user needs fresh ideas for a campaign, post, launch or season."
---

# marketing-ideas · Content & Editorial

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/customer-research`
- `02-strategy/product-marketing`
- `01-intel/market-analysis`

## Process
1. Pull raw material: customer pains/phrases, product truths, seasonal moments, trends, competitor gaps, founder story.
2. Generate 30 ideas across angle types: contrarian take · myth-busting · behind the scenes · customer story · data/stat reveal · challenge · how-to · comparison · trend-jacking · stunt/PR · community/UGC · giveaway/collab.
3. Score each: Relevance to goal, Novelty, Ease, Reach potential (1–5 each).

## Output
Top 10 ideas, each: name · one-line concept · hook (first line/3 seconds) · format/channel · effort · why it'll work. Plus the full brief for the #1 idea.

## Save
- Write to `brands/<slug>/04-content/marketing-ideas-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · marketing-ideas · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
