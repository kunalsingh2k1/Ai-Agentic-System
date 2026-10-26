---
name: prospecting
description: "Define the ideal customer profile and find and qualify ideal prospects, accounts or partners. Use for B2B outbound, account-based marketing or creator/partner lists."
---

# prospecting · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `01-intel/customer-research`

## Process
1. Build the ICP from best existing customers: firmographics (industry, size, region, tech stack) or demographics, plus **triggers** (hiring, funding, new launch, seasonal moment, bad review of a competitor).
2. Define qualification criteria and a 0–100 fit score (fit 50 pts, trigger/timing 30 pts, reachability 20 pts).
3. List sources to find them: LinkedIn search strings, directories, communities, marketplaces, event attendee lists, Google search operators. Write the exact search strings.
4. If research tools are available, find 10–25 sample prospects and score them.

## Output
- ICP one-pager + anti-ICP (who to avoid)
- Search strings / list-building recipes
- Scored prospect table (name · why fit · trigger · score · suggested first touch)
- 3-touch outreach sequence draft (draft only, never send)

## Save
- Write to `brands/<slug>/01-intel/prospecting-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · prospecting · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
