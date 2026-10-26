---
name: signup
description: "Improve signup and registration flows and activation: fields, steps, social login, onboarding. Use when signups drop off or new users don't activate."
---

# signup · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `07-analytics/cro`
- `07-analytics/analytics`

## Process
1. Map every step from CTA click to first value ("aha" moment). Note fields, screens, emails and time per step.
2. Find drop-off per step (data in `data/` or ask). Biggest leak first.
3. Fixes: fewer fields (ask later), social/Google sign-in, magic links, inline validation, clear password rules, progress indicator, explain why you ask for data, delay credit card if possible, skip email verification before first value.
4. Onboarding: welcome screen with one action, checklist, empty states that teach, templates/sample data.

## Output
Current flow map with drop-offs, redesigned flow, field-by-field recommendations, onboarding checklist copy, activation metric definition.

## Save
- Write to `brands/<slug>/07-analytics/signup-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · signup · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
