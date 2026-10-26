---
name: market-analysis
description: "Analyze the market: size, trends, segments, seasonality and opportunities (TAM/SAM/SOM, SWOT, PESTLE). Use at the start of strategy work or when entering a new market."
---

# market-analysis · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`

## Process
1. Define the market precisely (category × geography × segment).
2. Size it top-down (industry reports, public data) **and** bottom-up (number of buyers × price × frequency). Show the math; label every number [Research] with source or [Estimate].
3. Trends: Google Trends for 3–5 category terms (5-year view, seasonality), new entrants, platform shifts, regulation (PESTLE quick scan).
4. SWOT for the brand, grounded in competitor and customer research where available.
5. Opportunity scan: underserved segments, rising search terms, channels competitors ignore.

## Output
- Market snapshot: TAM / SAM / SOM with method
- Seasonality calendar (peak and dead months)
- 5 trends that matter and what each means for the brand
- SWOT
- Top 3 opportunities, each with first move and success signal

## Save
- Write to `brands/<slug>/01-intel/market-analysis-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · market-analysis · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
