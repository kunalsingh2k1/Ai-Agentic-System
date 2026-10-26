---
name: video
description: "Create AI-assisted video content: short-form scripts, hooks, storyboards, YouTube outlines and editing notes. Use for Reels, Shorts, TikTok or YouTube."
---

# video · Social & LinkedIn

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `05-social/social`
- `04-content/marketing-ideas`

## Process
1. Pick format: short (15–60 s Reels/Shorts/TikTok), mid (2–5 min), long (YouTube 8–15 min).
2. Hook in the first 1–3 seconds: visual pattern interrupt + text overlay + spoken line. Write 5 hook variants.
3. Script with retention beats: hook → promise → value in fast steps (cut every 2–4 s for short form) → payoff → CTA. Long form: open loop, chapters, re-hooks every 60–90 s.
4. Production notes: shot list, B-roll, on-screen text, captions, music mood, thumbnail concept and title options for YouTube.
5. AI assist options: AI voice-over, avatar, auto-captions, AI B-roll/image generation prompts; add disclosure where platforms require it.

## Output
For each video: title, 5 hooks, timed script (table: time · visual · voice/on-screen text), shot list, caption + hashtags, thumbnail brief.

## Save
- Write to `brands/<slug>/05-social/video-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · video · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
