---
name: programmatic-seo
description: "Create SEO pages at scale from templates and data (locations, integrations, use cases, comparisons). Use when there are many similar long-tail searches."
---

# programmatic-seo · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/keyword-research`
- `03-seo/site-architecture`

## Process
1. Find the pattern: [head term] × [modifier] (e.g. "CRM for {industry}", "{tool} integration", "{service} in {city}"). Validate that real search demand exists across modifiers.
2. Define the dataset: columns needed per page, sources, how unique data per page will be (avoid thin, doorway pages).
3. Design the template: H1 pattern, intro with unique data, sections that change per row, static trust sections, FAQs, internal links to siblings and parent.
4. Quality gates: minimum unique content per page, noindex rules for rows without data, rollout in batches (50 → measure → scale).

## Output
Pattern + demand table, dataset schema (CSV header + 5 example rows), page template, 2 fully rendered sample pages, rollout and monitoring plan.

## Save
- Write to `brands/<slug>/03-seo/programmatic-seo-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · programmatic-seo · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
