---
name: customer-research
description: "Research and synthesize customer pain points, jobs-to-be-done, objections and the exact words customers use. Use when starting work on a brand, when messaging feels generic, or before writing copy."
---

# customer-research · Market Intelligence

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `brand.md`
- `data/ (reviews, surveys, interviews, support tickets)`

## Process
1. Gather voice-of-customer sources, best first: files in `data/` (reviews, survey exports, interview notes, support tickets) → the brand's own reviews (Google, Amazon, G2, App Store, Trustpilot) → competitor reviews → Reddit/Quora/forums/YouTube comments in the category (use WebSearch/WebFetch when available).
2. Pull 30+ verbatim quotes. Keep the customer's wording; note the source of each.
3. Code each quote: **Pain** · **Desired outcome** · **Trigger** (what made them look now) · **Objection/anxiety** · **Alternative tried** · **Decision criteria**.
4. Cluster into 3–5 segments by job-to-be-done, not by demographics.
5. For each segment write a one-paragraph JTBD statement: "When ___, I want to ___, so I can ___."

## Output
- Segment table: segment · JTBD · top 3 pains · top trigger · main objection · where they hang out online
- **Message bank**: 20 best verbatim phrases, grouped by pain/outcome, ready for copy
- Objection list with the best answer for each
- Gaps: what we still don't know and the cheapest way to find out (5-question survey draft included)

## Save
- Write to `brands/<slug>/01-intel/customer-research-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · customer-research · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
