---
name: community-marketing
description: "Build and grow community-driven marketing: groups, Discord/WhatsApp/Telegram communities, Reddit, forums, ambassadors and UGC. Use when the brand wants loyal fans and word of mouth."
---

# community-marketing · Social & LinkedIn

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `01-intel/customer-research`
- `02-strategy/brand-positioning`

## Process
1. Decide: **join** existing communities (Reddit, Facebook groups, Slack/Discord, forums) vs. **build** an owned one. Usually join first, build when there is demand.
2. Join: list top 10 communities, their rules, and a give-first participation plan (answer questions, share resources; promotion ≤ 10%).
3. Build: purpose, platform, membership promise, rituals (weekly thread, AMA, challenges), onboarding message, moderation rules, first 100 members plan, engagement metrics.
4. UGC engine: prompts, hashtag, reshare rights process, rewards.

## Output
Community strategy, target community list, 30-day engagement calendar, welcome message and rules drafts, UGC campaign brief.

## Save
- Write to `brands/<slug>/05-social/community-marketing-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · community-marketing · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
