---
name: hub-onboard
description: "Onboard one or more brands into the marketing hub: turn pasted brand details, a website URL or a short interview into brands/<slug>/brand.md and the folder structure. Use when the user gives brand details or says 'add a brand', 'new brand', 'onboard'."
---

# hub-onboard · add brands to the hub

Input: `$ARGUMENTS`, plus whatever the user pasted: free text, a website URL, social handles, documents, or several brands at once.

## Steps (repeat for each brand)
1. **Identify the brand** and its slug (lowercase, hyphenated). If `brands/<slug>/` already exists, update its `brand.md` and don't overwrite it; show what changed.
2. **Create the folder structure**: `brand.md` (copied from `brands/_template/brand.md`), `LOG.md`, `DECISIONS.md`, `SCORECARD.md`, `data/`, `reports/`, `01-intel/` … `08-ops/` (department folder names are listed in `CLAUDE.md`). Add a `.gitkeep` to every empty folder.
3. **Fill the profile** from what the user gave. If there's a website and WebFetch is available, read the homepage, about page, pricing/product pages and linked socials to fill gaps. Tag the facts you filled this way with [Research].
4. **Find the gaps.** Mark unknown fields `TODO`. Then ask the user **at most 8 questions**, covering only what matters most for the next steps: north-star goal and deadline, budget, team time, main competitors, priority channels, current numbers, compliance limits, best-selling product. Ask everything in one message.
5. **Ask for data.** Tell the user which exports to drop in `brands/<slug>/data/` to make the report data-driven: GA4 (traffic acquisition and landing pages, last 90 days), Search Console (queries and pages), social insights, ads, sales, reviews.
6. Write `brands/.active` with the slug (the last brand onboarded becomes active).
7. Append to `LOG.md`: `<date> · hub-onboard · brand.md · Brand onboarded (profile <N>% complete)`.

## Reply
For each brand: the slug, profile completeness (% of fields that aren't TODO), the 3 biggest unknowns, and the questions. Then: "Next: answer the questions (or say 'skip'), then run `/hub-report <slug>`."
