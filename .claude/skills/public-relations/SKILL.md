---
name: public-relations
description: "Get press coverage and media mentions: angles, press releases, media lists, pitches and digital PR. Use when the brand wants publicity, backlinks or credibility."
---

# public-relations · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `04-content/marketing-ideas`

## Process
1. Find newsworthy angles: original data/survey, trend commentary, founder story, milestone, community impact, contrarian expert take, local angle.
2. Targets: journalists/publications/podcasts/newsletters covering the beat in the last 6 months (search for recent articles); HARO-style requests (Qwoted, Featured, Source of Sources).
3. Pitch: subject line, 3-sentence pitch personalized to their recent work, why now, offer (data, interview, exclusive).
4. Press release (inverted pyramid, quote, boilerplate) when warranted.

## Output
Angle shortlist, target media list template with 10 examples, 3 pitch drafts, press release draft, press kit checklist. Draft only; the user sends.

## Save
- Write to `brands/<slug>/08-ops/public-relations-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · public-relations · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
