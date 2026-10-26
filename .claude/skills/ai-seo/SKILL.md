---
name: ai-seo
description: "Optimize content for AI search and LLM visibility (ChatGPT, Perplexity, Google AI Overviews, Claude). Use when the brand wants to be cited or recommended by AI assistants."
---

# ai-seo · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/seo-audit`
- `03-seo/keyword-research`

## Process
1. Test visibility: list 15 buyer questions in the category ("best X for Y", "X vs Y", "how to ___"). Where possible, check what AI search returns and who gets cited; record whether the brand appears.
2. Diagnose: is the brand present on the sources AIs cite (Wikipedia, Reddit, review sites, listicles, YouTube, docs)? Are its pages easy to quote?
3. Fixes:
   - Answer-first structure: question H2 → 40–60 word direct answer → details
   - Clear entity facts (who, what, where, pricing, founded) on an About/facts page + Organization schema
   - Original data, stats and definitions worth citing
   - Comparison and "best for" pages
   - Presence on third-party lists, communities, and review sites
   - `llms.txt` and clean, crawlable HTML (no content locked in JS)

## Output
Visibility scorecard per question, gap list, page rewrite examples, off-site citation targets, and a monthly re-check routine.

## Save
- Write to `brands/<slug>/03-seo/ai-seo-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · ai-seo · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
