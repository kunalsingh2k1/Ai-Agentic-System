---
name: competitor-profiling
description: "Analyze competitor messaging, positioning, offers, channels and weaknesses in depth. Use when the user names competitors or asks how the brand compares."
---

# competitor-profiling · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `01-intel/customer-research`

## Process
1. Take competitors from `brand.md` (or find 3–5 by searching the brand's main keywords and category). Split into **direct**, **indirect** and **status quo / DIY**.
2. For each competitor, review homepage, pricing page, top landing pages, social profiles, ad libraries (Meta Ad Library, Google Ads Transparency, LinkedIn Ads) and reviews.
3. Capture: headline promise · target segment · key differentiator claimed · proof used · pricing model & entry price · main CTA · channels they invest in (posting frequency, follower size, ads running) · content themes · review complaints.

## Output
- One profile card per competitor (the fields above + "how to beat them")
- **Positioning map**: 2 axes that matter to buyers, each competitor placed, with the open space marked
- Messaging overlap: claims everyone makes (avoid) vs. claims nobody owns (opportunity)
- Top 5 actions for our brand, ranked by impact/effort

## Save
- Write to `brands/<slug>/01-intel/competitor-profiling-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · competitor-profiling · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
