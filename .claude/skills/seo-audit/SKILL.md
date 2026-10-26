---
name: seo-audit
description: "Audit and diagnose a website's SEO: technical, on-page, content and authority issues, prioritized into a fix list. Use when the user shares a site URL or asks why they don't rank."
---

# seo-audit · SEO & Search

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `data/ (Search Console, crawl exports)`

## Process
1. If `data/` has Search Console / crawl exports, analyze them first [Data]. Otherwise fetch the homepage, key pages, `robots.txt` and `sitemap.xml` with WebFetch, and run `site:` searches.
2. **Technical**: indexability, robots/sitemap, canonicals, redirects/404s, HTTPS, mobile, Core Web Vitals (suggest PageSpeed Insights check), duplicate content, structured data.
3. **On-page** (top 10 pages): title, meta description, H1, heading structure, keyword targeting, internal links, image alt text, content depth vs. ranking pages.
4. **Content**: topical coverage gaps vs. competitors, thin/cannibalizing pages, freshness.
5. **Authority**: backlink profile signals, brand mentions, local SEO (Google Business Profile, NAP) if local.

## Output
Score per area (0–10), issue table (issue · page(s) · impact · effort · fix), top 10 fixes ranked, and a 30-day SEO sprint.

## Save
- Write to `brands/<slug>/03-seo/seo-audit-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · seo-audit · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
