---
name: marketing-psychology
description: "Apply behavioral science (triggers, biases, persuasion principles) ethically to the brand's pages, offers and campaigns. Use when conversion is weak or copy lacks pull."
---

# marketing-psychology · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `01-intel/customer-research`

## Toolkit (pick what fits; never deceive)
Social proof · authority · reciprocity · commitment & consistency · loss aversion · anchoring · decoy pricing · scarcity/urgency (only if real) · default effect · endowment (trials, previews) · Zeigarnik/progress bars · peak-end rule · fluency (simple = true) · specificity ("4,312 customers" beats "thousands") · risk reversal.

## Process
1. Map the buyer journey for the main conversion (aware → interested → evaluating → buying → onboarding).
2. At each step name the main **friction** (anxiety, effort, doubt) and the main **motivation**.
3. Pick 1–2 principles per step that reduce friction or raise motivation, and write the concrete change.

## Output
Table: journey step · friction · principle · specific change (copy/design/offer) · expected effect · how to test. Flag anything that would be a dark pattern and do not recommend it.

## Save
- Write to `brands/<slug>/01-intel/marketing-psychology-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · marketing-psychology · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
