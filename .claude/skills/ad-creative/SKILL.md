---
name: ad-creative
description: "Generate ad headlines, primary text, descriptions, visual concepts and video ad scripts for Meta, Google, LinkedIn, TikTok and YouTube. Use when the user needs ad copy or creative."
---

# ad-creative · Demand Generation

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `01-intel/customer-research`
- `02-strategy/offers`

## Process
1. Define audience temperature (cold / warm / hot) and the angle per temperature.
2. Generate angles: pain, desired outcome, social proof, objection-killer, comparison, offer/urgency, founder story, UGC-style.
3. Respect platform limits: Google RSA headlines ≤ 30 chars (15) + descriptions ≤ 90 (4); Meta primary text (first 125 chars visible), headline ≤ 40; LinkedIn intro ≤ 150 visible; TikTok/Reels 9:16 scripts with a 2-second hook.
4. Check ad policy risks (claims, before/after, personal attributes, restricted categories).

## Output
Per platform: 5 angles × copy variants in tables (with character counts), 3 visual concepts, 2 short video ad scripts, and a naming convention for testing.

## Save
- Write to `brands/<slug>/06-demand/ad-creative-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · ad-creative · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
