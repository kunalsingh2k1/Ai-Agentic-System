---
name: image
description: "Plan and generate image and social graphic concepts, AI image prompts and design briefs. Use when content needs visuals, carousels, ad images or thumbnails."
---

# image · Social & LinkedIn

## Setup
1. Brand: use the slug in the arguments (`$ARGUMENTS`); else the slug in `brands/.active`; else ask which brand in `brands/`.
2. Read `brands/<slug>/brand.md`. If it is missing, stop and suggest `/hub-onboard`.
3. Read earlier outputs this skill builds on (latest file of each, if present):
- `02-strategy/brand-positioning`
- `05-social/social`

## Process
1. Pull brand visual identity from `brand.md` (colors, fonts, logo rules, photo style). If missing, propose one and mark it as a proposal.
2. For each asset: purpose, platform size (IG feed 1080×1350, Story/Reel 1080×1920, LinkedIn 1200×1500 or 1080×1080, YouTube thumb 1280×720, Pinterest 1000×1500, OG image 1200×630), message, focal point, text overlay (≤ 7 words).
3. Carousels: slide-by-slide copy (hook slide → value slides → CTA slide).
4. Write AI image prompts (subject, setting, style, lighting, lens, color palette, aspect ratio, negative prompt) for Midjourney/DALL·E/Imagen/Ideogram, and Canva/Figma layout notes.

## Output
Asset brief table + slide copy + ready-to-use prompts. When code-drawn graphics fit (quote cards, stat cards), create SVG/HTML files in the brand's `05-social/assets/` folder.

## Save
- Write to `brands/<slug>/05-social/image-<YYYY-MM-DD>.md` (today's date).
- Append to `brands/<slug>/LOG.md`: `<date> · image · <file> · <one-line headline>`.
- Follow the hub rules in `CLAUDE.md`: tag claims [Data] / [Research] / [Estimate], match the brand voice, draft only.
- End your reply with the 3 most important next actions and which skill to run next.
