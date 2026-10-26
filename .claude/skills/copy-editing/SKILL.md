---
name: copy-editing
description: "Improve and refresh existing copy for clarity, persuasion and voice. Use when the user shares copy, a URL or a draft to improve."
---

# copy-editing · Content & Editorial

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/brand-positioning`
- `02-strategy/product-marketing`

## Process (sweeps, in order)
1. **Clarity**: can a stranger say what it is, who it's for and why it's better in 5 seconds?
2. **Voice**: matches the brand voice guide?
3. **So-what**: every feature tied to a benefit and outcome.
4. **Proof**: claims backed by numbers, names, examples.
5. **Specificity**: replace vague words (innovative, seamless, best-in-class, solutions).
6. **Friction & CTA**: one clear next step, low-commitment wording.
7. **Cut**: remove 20–30% of words.

## Output
Before/after table for each changed line with the reason, the full revised version, and a score (1–10) before and after for clarity, persuasion and voice.

## Save
- Write to `brands/<slug>/04-content/copy-editing-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · copy-editing · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
