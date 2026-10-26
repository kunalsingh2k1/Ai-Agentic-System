---
name: site-architecture
description: "Plan page hierarchy, navigation, URL structure and internal linking. Use when building a new site, restructuring, or when pages don't get found."
---

# site-architecture · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/keyword-research`
- `02-strategy/product-marketing`

## Process
1. Map keyword clusters → pages (one primary intent per page, no cannibalization).
2. Design hub-and-spoke structure: pillar pages for each core topic, cluster pages linking up and across.
3. URL rules (short, lowercase, hyphenated, no dates unless news), max 3 clicks from home to any key page.
4. Navigation: primary nav (≤ 7 items, buyer language), footer, breadcrumbs.
5. Internal-link plan: which pages link to which with what anchor text; orphan pages to fix.

## Output
Sitemap tree (Mermaid or indented list) with URL, page type, target keyword per page; nav spec; internal-link matrix; migration/redirect list if restructuring.

## Save
- Write to `brands/<slug>/03-seo/site-architecture-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · site-architecture · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
