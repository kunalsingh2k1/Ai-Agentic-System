---
name: keyword-research
description: "Find and cluster high-intent keywords and topics. Use before writing content, building pages, or planning SEO."
---

# keyword-research · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `01-intel/customer-research`
- `data/ (keyword tool exports)`

## Process
1. Seeds: product terms, problems, customer phrases from the message bank, competitor names, use cases.
2. Expand: Google autocomplete, People Also Ask, related searches, Reddit/forum threads, competitor page titles. If `data/` has Ahrefs/Semrush/GSC exports use their volume and difficulty [Data]; else label volume as [Estimate] (High/Med/Low).
3. Classify intent: Informational · Commercial investigation · Transactional · Navigational.
4. Cluster by shared SERP intent (one page per cluster). Score each cluster: Business value (0–3) × Intent × ease.

## Output
Cluster table: cluster · primary keyword · secondaries · intent · est. volume · difficulty · business value · target page (new/existing) · priority. Plus: 10 quick wins and 5 big bets.

## Save
- Write to `brands/<slug>/03-seo/keyword-research-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · keyword-research · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
