---
name: popups
description: "Create conversion-focused popups, slide-ins, banners and overlays with the right triggers and offers. Use when the brand wants more email signups or to recover leaving visitors."
---

# popups · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `06-demand/lead-magnets`
- `02-strategy/offers`

## Process
1. Pick type by goal: exit-intent (recover), timed/scroll-depth (engaged readers), click-triggered (highest intent), slide-in (low annoyance), top bar (announcements), spin-to-win (ecom only if on-brand).
2. Targeting rules: page, source, new vs returning, frequency cap (don't show again for 7–14 days after close), never block mobile content on entry (Google intrusive-interstitial penalty).
3. Offer + copy: headline (value), subtext, single field, CTA (first-person: "Send me the guide"), decline line that is polite (no confirm-shaming).

## Output
Popup plan (type · page · trigger · audience · offer), copy for each, design spec, and success benchmarks (2–5% view-to-submit typical).

## Save
- Write to `brands/<slug>/07-analytics/popups-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · popups · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
