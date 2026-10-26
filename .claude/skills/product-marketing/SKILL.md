---
name: product-marketing
description: "Define audience, story and product positioning; build the messaging framework that every other skill uses. Use after research and before writing copy or launching campaigns."
---

# product-marketing · Strategy & Positioning

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/customer-research`
- `01-intel/competitor-profiling`

## Process
1. Positioning (April Dunford style): competitive alternatives → unique attributes → value those attributes enable → who cares most → market category frame.
2. Messaging hierarchy: one-line value prop → 3 pillars (each: claim, proof, customer phrase) → feature → benefit → outcome mapping.
3. Story: the old way, why it breaks now, the new way, how the product makes it possible, proof.
4. Write per-segment variants of the value prop.

## Output
Save as the brand's **messaging framework** (other skills read it):
- Positioning statement
- Value prop (10 words) + elevator pitch (50 words)
- 3 pillars with proof points
- Feature → benefit → outcome table
- Segment variants
- Words to use / words to avoid

## Save
- Write to `brands/<slug>/02-strategy/product-marketing-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · product-marketing · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
