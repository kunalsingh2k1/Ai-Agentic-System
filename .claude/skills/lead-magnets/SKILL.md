---
name: lead-magnets
description: "Create lead magnets for email capture: checklists, templates, guides, quizzes, mini-courses. Use when the brand needs to grow its email/WhatsApp list."
---

# lead-magnets · Demand Generation

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/customer-research`
- `02-strategy/product-marketing`

## Process
1. Pick a narrow, urgent problem the ideal buyer has right before needing the product.
2. Generate 10 lead-magnet ideas across formats (checklist, template, swipe file, calculator, quiz, mini-course, report, toolkit); score by perceived value × ease × closeness to the product.
3. Write the winner in full (or full outline if long), plus the opt-in page copy and thank-you page with next step.

## Output
Idea scorecard, the lead magnet content, landing page copy, 3 promotion placements (site, social, ads), and the first welcome email (hand off to `/lead-nurture`).

## Save
- Write to `brands/<slug>/06-demand/lead-magnets-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · lead-magnets · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
