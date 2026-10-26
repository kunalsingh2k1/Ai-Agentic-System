---
name: schema
description: "Add and optimize structured data (JSON-LD schema markup) for rich results and AI understanding. Use when setting up a site, product pages, FAQs, articles, local business or events."
---

# schema · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/seo-audit`

## Process
1. Inventory page types and pick schema types: Organization, WebSite, LocalBusiness, Product + Offer + AggregateRating, Article/BlogPosting, FAQPage, HowTo, BreadcrumbList, Event, SoftwareApplication, VideoObject.
2. Check existing markup on key pages (fetch and look for `application/ld+json`).
3. Write valid JSON-LD for each page type using real brand data only; never mark up content not visible on the page; ratings only if genuine.

## Output
Page type → schema mapping, ready-to-paste JSON-LD blocks, where to put them, and how to validate (Google Rich Results Test, Schema.org validator).

## Save
- Write to `brands/<slug>/03-seo/schema-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · schema · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
