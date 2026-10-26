---
name: referrals
description: "Design referral and affiliate programs: incentives, mechanics, messaging and tracking. Use when happy customers could bring more customers."
---

# referrals · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/offers`
- `02-strategy/marketing-loops`

## Process
1. Choose: customer referral (give-get), affiliate (commission for creators/partners), or ambassador program.
2. Incentive design: double-sided rewards, reward type (cash, credit, product, status), economics (reward ≤ ~30% of first-order margin or a fraction of LTV).
3. Moments to ask: after a success moment, after 5-star review, post-purchase, in-product.
4. Mechanics: links/codes, tracking tool options, fraud rules, payout terms, affiliate terms.

## Output
Program design, economics table, referral page + email/in-app copy, affiliate recruitment pitch, tracking & tool shortlist.

## Save
- Write to `brands/<slug>/08-ops/referrals-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · referrals · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
