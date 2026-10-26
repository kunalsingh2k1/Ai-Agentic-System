# Ai-Agentic-System · AI Marketing Hub

An agentic marketing team that runs inside **Claude Code**: 48 specialist skills in 8 departments, plus 6 hub commands that take a brand from raw details to a full analytics report, strategy, ready-to-post content and weekly growth coaching. It handles many brands side by side and uses your Claude plan, so no API key is needed.

## Quick start

1. Open this folder in Claude Code.
2. Paste your brand details (or just a website and social handles) and run:
   ```
   /hub-onboard
   ```
   You can paste several brands at once. Answer the follow-up questions.
3. Optional, but it makes the report data-driven: drop exports into `brands/<slug>/data/` (GA4, Search Console, Instagram/LinkedIn insights, ads, sales, reviews).
4. Run the pipeline:

| Step | Command | You get |
|---|---|---|
| 1 | `/hub-onboard` | `brands/<slug>/brand.md` profile + folders |
| 2 | `/hub-report <slug>` | Complete analytics report (`reports/*.md` + `.html`): market, customers, competitors, SEO, AI search, social, data |
| 3 | `/hub-strategy <slug>` | Positioning, brand voice, messaging, offer, growth loop, 90-day plan + KPI targets |
| 4 | `/hub-content <slug>` | 30-day calendar (`.csv`), first 7 days of content fully written: posts, LinkedIn, video scripts, image prompts, copy |
| 5 | `/hub-grow <slug>` | Weekly: share your numbers, get a scorecard, wins/problems, this week's action plan |
| any | `/hub-status` | All brands, their stage, next step; `/hub-status <slug>` switches the active brand |

## AI Marketing Office (web UI)

```
cd office && npm start     # then open http://127.0.0.1:4317
```
Ask the AI Manager for work, approve or revise AI drafts, research and verify local leads, schedule weekly lead searches, and read every report. Nothing is posted or sent without you. Details: [office/README.md](office/README.md). Engineering docs: [docs/](docs/).

## The 48 skills

Each skill runs on its own too, e.g. `/seo-audit nimbu-naturals`, `/linkedin`, `/ad-creative`, `/marketing-council should we start Meta ads now?`.

- **Market Intelligence**: customer-research, competitor-profiling, competitors, prospecting, marketing-psychology, market-analysis
- **Strategy & Positioning**: product-marketing, offers, pricing, marketing-plan, marketing-loops, brand-positioning
- **SEO & Search**: seo-audit, ai-seo, site-architecture, programmatic-seo, schema, keyword-research
- **Content & Editorial**: content-strategy, copywriting, copy-editing, marketing-ideas, directory-submissions, content-calendar
- **Social & LinkedIn**: social, video, image, community-marketing, influencer-marketing, linkedin
- **Demand Generation**: lead-magnets, free-tools, ad-creative, ads, co-marketing, lead-nurture
- **Analytics & Insights**: cro, ab-testing, signup, popups, paywalls, analytics
- **Marketing Operations**: marketing-council, launch, public-relations, referrals, aso, revops

## How it works

- `CLAUDE.md`: the hub's operating rules (pipeline, folder layout, evidence and content rules)
- `.claude/skills/`: one folder per skill; edit any `SKILL.md` to change how that specialist works
- `brands/<slug>/`: everything about one brand: profile, log, decisions, scorecard, data, and outputs by department

Ground rules: every claim is tagged **[Data]**, **[Research]** or **[Estimate]**; nothing is invented; and everything is a **draft**. Claude never posts, sends or spends; you do.

---
`agent-office-prompt-pack/` is a separate prompt pack for building a self-hosted Agent Office.
