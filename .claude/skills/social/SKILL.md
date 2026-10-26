---
name: social
description: "Audit, plan, create and optimize social media content for Instagram, Facebook, X, Threads, TikTok, YouTube and Pinterest. Use when the user wants to grow on social media or needs posts."
---

# social · Social & LinkedIn

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/brand-positioning`
- `04-content/content-strategy`
- `data/ (social insights exports)`

## Process
1. **Audit** each active profile: bio/handle/link clarity, profile image, highlights/pins, posting frequency, format mix, top/bottom 5 posts and why, engagement rate (= engagements ÷ followers or reach), follower growth. Use exports in `data/` [Data] or what's publicly visible [Research].
2. **Platform fit**: pick 1–2 primary platforms where the audience is and the team can sustain output.
3. **Playbook per platform**: formats that work now (Reels/Shorts/carousels/threads), ideal length, cadence, best posting windows (from their insights if available), hashtag/keyword approach, engagement routine (15 min/day replying and commenting).
4. **Create**: write ready-to-post content.

## Output
Audit scorecard, profile fixes (rewritten bios), platform playbook, and a batch of 10 ready posts (hook · caption · CTA · hashtags · visual direction · alt text). Draft only; the user posts.

## Save
- Write to `brands/<slug>/05-social/social-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · social · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
