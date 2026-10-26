---
name: brand-positioning
description: "Clarify brand message, personality, voice and differentiation. Use when the brand feels generic, before a rebrand, or to create a brand voice guide for content."
---

# brand-positioning · Strategy & Positioning

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/customer-research`
- `01-intel/competitor-profiling`

## Process
1. Brand core: purpose (why), promise (what customers can count on), values (3, with behaviors), personality (archetype + 3 traits).
2. Differentiation: the one thing we can own; proof we own it; enemy (the old way/status quo).
3. Voice: 3–4 voice traits, each "we are X, not Y", with do/don't examples. Tone shifts by channel (LinkedIn vs Instagram vs support).
4. Taglines: 10 options, ranked.

## Output
**Brand voice guide** (other content skills read it): core, differentiation, voice traits with examples, vocabulary (use / avoid), tone by channel, sample rewrites of 3 existing lines, tagline shortlist.

## Save
- Write to `brands/<slug>/02-strategy/brand-positioning-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · brand-positioning · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
