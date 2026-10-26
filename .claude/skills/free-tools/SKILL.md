---
name: free-tools
description: "Plan or build free tools (calculators, graders, generators, checkers) as marketing assets that attract and capture leads. Use when the brand wants engineering-as-marketing."
---

# free-tools · Demand Generation

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `03-seo/keyword-research`
- `01-intel/customer-research`

## Process
1. Find tool ideas from search demand ("X calculator", "X generator", "X checker", "X template") and repeated customer tasks.
2. Score: search demand, closeness to the product, build effort, shareability.
3. Spec the winner: inputs, logic/formula, outputs, where the email gate goes (after showing partial value), CTA to the product.
4. Build it: a single self-contained HTML/JS file in the brand's `06-demand/tools/` folder, styled to the brand, mobile-friendly, no external data calls. Include SEO title/meta and an explainer section below the tool.

## Output
Idea scorecard, spec, working tool file, launch/distribution plan.

## Save
- Write to `brands/<slug>/06-demand/free-tools-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · free-tools · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
