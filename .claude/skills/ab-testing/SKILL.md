---
name: ab-testing
description: "Plan and run A/B experiments with proper hypotheses, sample sizes and analysis. Use when the user wants to test changes to pages, emails, ads or pricing."
---

# ab-testing · Analytics & Insights

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `07-analytics/cro`
- `07-analytics/analytics`

## Process
1. Hypothesis: "Because [evidence], changing [element] for [audience] will improve [metric], because [reason]."
2. Primary metric + guardrail metrics. Minimum detectable effect.
3. Sample size: use baseline rate, MDE, 95% confidence, 80% power. Calculate it (show the formula/result; run a quick Python calculation if available). Estimate duration from traffic; run full weeks; if traffic is too low, recommend bigger swings or sequential changes instead.
4. Analysis rules: no peeking/stopping early, check sample ratio mismatch, segment carefully.
5. If results are provided, analyze significance and give a ship / iterate / discard call.

## Output
Experiment backlog (ICE-scored), test spec for the top test, sample-size result, analysis template or results analysis.

## Save
- Write to `brands/<slug>/07-analytics/ab-testing-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · ab-testing · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
