---
name: aso
description: "Optimize App Store and Google Play listings (app store optimization): keywords, title, screenshots, ratings. Use for any brand with a mobile app."
---

# aso · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/keyword-research`
- `02-strategy/product-marketing`

## Process
1. Keywords: competitor titles/subtitles, autocomplete in stores, category terms. Prioritize relevance × volume × difficulty.
2. Metadata: iOS title (30) + subtitle (30) + keyword field (100, comma-separated, no spaces, no repeats); Google Play title (30) + short description (80) + long description (4,000, keywords natural).
3. Creative: icon, first 3 screenshots tell the story (benefit captions), preview video.
4. Ratings: in-app review prompt at success moments, reply to reviews, fix top complaints.
5. Localization for priority markets.

## Output
Keyword table, rewritten metadata for both stores (with character counts), screenshot storyboard, ratings plan.

## Save
- Write to `brands/<slug>/08-ops/aso-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · aso · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
