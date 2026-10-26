---
name: hub-grow
description: "Weekly growth coach for a brand: review this week's numbers against targets, find what worked, and give a clear action plan for social media and the website for the coming week. Use when the user shares results, asks 'how am I doing', 'what should I do this week', or wants guidance to grow."
---

# hub-grow · weekly growth coaching loop

Brand: `$ARGUMENTS`, else `brands/.active`. Read `brand.md`, `SCORECARD.md`, the latest strategy summary and content calendar, the last 10 lines of `LOG.md`, and any files added to `data/` since the last review.

## 1. Get this week's numbers
If the user hasn't shared numbers and there's no new data, ask for the few that matter (one message): followers and reach per primary platform, top 3 posts, website sessions, leads/sales, ad spend and results, plus anything notable that happened. Accept rough numbers or screenshots.

## 2. Update the scorecard
Add a row per metric to `SCORECARD.md` (week · metric · value · target · change vs last week · status 🟢🟡🔴). Never fill in numbers the user didn't give.

## 3. Diagnose
- **Wins**: what moved and why (which posts, pages or campaigns), so we can do more of it.
- **Problems**: what's behind target. Find the likely cause by working down the funnel: reach → engagement → clicks → conversion.
- **Pattern check**: compare top versus bottom content (hook, format, topic, posting time). After 4+ weeks of data, identify the brand's own winning formula.

## 4. Coach
Give **this week's plan**, no more than 7 actions, ranked, each with the time it takes and the skill that helps:
- Social: what to post more or less of, a hook to test, an engagement routine, a collab or community move
- Website: one conversion or SEO fix (`cro`, `seo-audit`, `copy-editing`)
- Demand: one list-growth or ads move, if relevant
- One experiment, with a hypothesis and success metric (`ab-testing`)

When a milestone is hit or missed for 2+ weeks running, recommend whether to adjust the plan (and run `marketing-council` on whether to switch channels or offer).

## 5. Save and finish
Save `brands/<slug>/07-analytics/weekly-review-<YYYY-MM-DD>.md` and append to `LOG.md`. Reply with the scorecard table, wins and problems (3 bullets each), and the action plan. Offer to produce this week's content with `/hub-content`.
