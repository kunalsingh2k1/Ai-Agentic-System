---
name: directory-submissions
description: "Submit products to relevant directories, marketplaces, listings and review sites for backlinks, visibility and AI citations. Use for launches and local/SaaS discoverability."
---

# directory-submissions · Content & Editorial

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`

## Process
1. Build a target list by type: general (Product Hunt, Crunchbase, G2, Capterra, Trustpilot), niche/category directories, local (Google Business Profile, Bing Places, Apple Business Connect, Yelp, Justdial/IndiaMART for India, local chambers), marketplaces/app stores, "awesome" lists, AI tool directories if relevant.
2. Prioritize by relevance, domain authority, traffic potential and whether buyers actually browse it.
3. Prepare one master listing kit so submissions are consistent (NAP must match exactly for local).

## Output
Prioritized directory table (name · URL · type · cost · priority · status column), plus the listing kit: names, 50/150/300-word descriptions, categories, tags, logo/screenshot specs, founder bio, FAQs. The user submits; never create accounts on their behalf.

## Save
- Write to `brands/<slug>/04-content/directory-submissions-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · directory-submissions · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
