---
name: marketing-council
description: "Provide multi-expert marketing advice: a panel of specialist perspectives debates a decision and gives a recommendation. Use for big decisions, trade-offs, or 'what should I do next?' questions."
---

# marketing-council · Marketing Operations

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `everything in the brand folder`

## Process
1. Restate the decision/question and the constraint (budget, time, team).
2. Convene 5 experts who matter for this question, chosen from: Brand strategist · Performance marketer · SEO lead · Content/social lead · Growth/product marketer · CRO analyst · Sales/RevOps lead · CFO voice (unit economics) · The customer.
3. Each gives: recommendation, reasoning, biggest risk (3–5 lines each, from their real perspective; they may disagree).
4. Debate round: the 2 strongest disagreements, resolved with evidence from the brand folder.
5. Verdict: decision, why, what would change our mind, first 3 actions.

## Output
Council transcript (concise) + verdict box. Save the verdict also as a line in `brands/<slug>/DECISIONS.md`.

## Save
- Write to `brands/<slug>/08-ops/marketing-council-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · marketing-council · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
