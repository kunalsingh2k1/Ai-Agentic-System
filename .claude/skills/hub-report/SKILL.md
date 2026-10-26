---
name: hub-report
description: "Produce the complete analytics report for a brand: market, customers, competitors, website/SEO, AI search, social media and performance data, combined into one scored report with prioritized opportunities (Markdown + HTML). Use when the user asks for a full analysis, audit or report."
---

# hub-report · complete brand analytics report

Brand: `$ARGUMENTS`, else `brands/.active`. Read `brands/<slug>/brand.md` and list the files in `data/`.

## 1. Run the research skills
Run each skill below in order: invoke it with the Skill tool, or read `.claude/skills/<name>/SKILL.md` and follow it. Each one saves its own file. Skip a skill if its output is less than 30 days old, and reuse that output instead.

1. `market-analysis`
2. `customer-research`
3. `competitor-profiling`
4. `seo-audit` (only if the brand has a website)
5. `ai-seo` (visibility check only)
6. `social`: audit section only, for each active profile
7. `analytics`: performance analysis section only, if `data/` has exports

To save time, independent skills (1, 4, 6) can run in parallel subagents. Give each subagent the brand slug and tell it to follow the skill file and save its output.

## 2. Write the report
Save to `brands/<slug>/reports/brand-report-<YYYY-MM-DD>.md`:

1. **Executive summary**: 5 bullets: where the brand stands, the biggest problem, the biggest opportunity, and what to do first.
2. **Health scorecard** (0–10 per area, with a one-line reason): Positioning & messaging · Website & conversion · SEO · AI search visibility · Social media (one line per platform) · Content · Email/CRM · Paid ads · Measurement/tracking. Add a confidence level (High/Med/Low) to each score, based on how much of it rests on [Data] versus [Estimate].
3. **Market & audience**: market snapshot, segments, key customer phrases.
4. **Competitive landscape**: positioning map, where competitors are weak.
5. **Website & search findings**: top issues and quick wins.
6. **Social media findings**: one section per platform: what works, what doesn't, benchmark comparison.
7. **Performance data** (if any): trends, channel mix, funnel.
8. **SWOT**.
9. **Opportunity backlog**: table of the top 15 opportunities: opportunity · area · impact · effort · ICE score · skill that executes it.
10. **Data gaps**: what's missing and how to get it.
11. **Sources**: links to the department files used.

## 3. HTML version
Also save `reports/brand-report-<YYYY-MM-DD>.html`. It must be a single self-contained file (inline CSS, no external requests) that renders the same content cleanly: the brand name and date in the header, scorecard as colored bars, tables styled, printable, mobile-friendly, and light/dark aware. Use the brand's colors if they are known.

## 4. Finish
Append to `LOG.md`. Reply with the executive summary, the scorecard table, the paths of both files, and: "Next: `/hub-strategy <slug>`."
