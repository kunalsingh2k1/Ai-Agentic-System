---
name: content-calendar
description: "Plan and organize content across channels into a dated calendar. Use when the user wants a weekly/monthly posting plan or schedule."
---

# content-calendar · Content & Editorial

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `04-content/content-strategy`
- `05-social/social`
- `01-intel/market-analysis (seasonality)`

## Process
1. Confirm period (default: next 30 days from today), channels and realistic capacity (posts/week per channel).
2. Add key dates: holidays, industry events, brand launches, seasonal peaks for the brand's market and country.
3. Balance pillars and the mix: 40% educate · 25% engage/community · 20% proof/stories · 15% promote.
4. Batch-friendly: group production (film day, design day).

## Output
Calendar table: date · day · channel · pillar · format · topic/hook · CTA · status. Also save a CSV copy (`content-calendar-<date>.csv`) importable into Notion/Sheets/Buffer. Note which items need `/copywriting`, `/image` or `/video` next.

## Save
- Write to `brands/<slug>/04-content/content-calendar-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · content-calendar · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
