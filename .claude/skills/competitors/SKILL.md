---
name: competitors
description: "Create competitor comparison and alternative pages ('X vs Y', 'X alternatives') that rank and convert. Use when the brand wants to capture comparison-search traffic."
---

# competitors · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/competitor-profiling`
- `03-seo/keyword-research`

## Process
1. List comparison keywords: "[competitor] alternatives", "[brand] vs [competitor]", "best [category] for [segment]". Estimate intent and priority.
2. Pick the page type for each: **1-vs-1** page, **alternatives** roundup, or **best-for** roundup.
3. Write honestly: acknowledge where the competitor is better; it builds trust and survives legal review. Only state facts you can source (link or date them).

## Page template
- H1 + subhead naming who should pick which option
- TL;DR comparison table (5–8 buyer-relevant rows, not feature dumps)
- "Why people switch" (from competitor review complaints)
- Section per decision criterion, with proof
- Migration/switching help + CTA
- FAQ (feeds FAQ schema)

## Output
A prioritized list of comparison pages + full draft of the top one, with meta title, meta description and FAQ.

## Save
- Write to `brands/<slug>/01-intel/competitors-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · competitors · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
