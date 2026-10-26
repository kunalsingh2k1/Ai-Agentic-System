---
name: lead-nurture
description: "Design email, SMS and WhatsApp nurture sequences that move leads to customers and keep customers buying. Use for welcome flows, nurture, abandoned cart, onboarding and win-back."
---

# lead-nurture · Demand Generation

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/product-marketing`
- `06-demand/lead-magnets`
- `02-strategy/brand-positioning`

## Process
1. Map lifecycle flows needed: welcome/lead-magnet delivery, nurture, abandoned cart/checkout/browse (ecom), trial onboarding (SaaS), post-purchase, review request, win-back, re-engagement.
2. Per flow: trigger, exit condition, number of messages, timing, goal per message.
3. Write each message: subject line (2 variants) + preview text, body (one idea, one CTA), CTA. Mix value (education, stories) with asks.
4. Segment rules and list hygiene; compliance (unsubscribe, consent for SMS/WhatsApp).

## Output
Flow map (Mermaid), full copy for the priority flow, outlines for the others, and target benchmarks (open, click, conversion) to watch.

## Save
- Write to `brands/<slug>/06-demand/lead-nurture-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · lead-nurture · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
