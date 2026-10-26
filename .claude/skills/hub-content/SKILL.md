---
name: hub-content
description: "Create a brand's content: content strategy, a dated multi-channel calendar, and ready-to-post content (social posts, LinkedIn, video scripts, image prompts, blog/landing copy, emails). Use when the user asks for content, posts, a calendar or 'what should I post'."
---

# hub-content · calendar and ready-to-post content

Brand: `$ARGUMENTS`, else `brands/.active`. You can also take a period ("next 2 weeks", "November") and channels from the arguments. Default: the next 30 days, using the strategy's primary channels.

## 1. Foundations (only if missing or more than 60 days old)
- `content-strategy`
- `keyword-research`: only if SEO or blog is a primary channel

## 2. Calendar
Run `content-calendar` for the period. This produces the .md and .csv files.

## 3. Produce the content
Produce **the first 7 days in full**, ready to post. For the rest of the period, give a hook and an outline for each item. Use the skill that matches the channel:
- Instagram / Facebook / TikTok / X / Threads / Pinterest → `social`
- LinkedIn → `linkedin`
- Reels / Shorts / YouTube → `video`
- Visuals, carousels, thumbnails → `image`
- Blog, landing pages, product pages → `copywriting`, plus `schema` for FAQ/article markup
- Email / WhatsApp broadcasts → `lead-nurture`

Save every piece in `brands/<slug>/04-content/posts/<YYYY-MM-DD>/` (the date it goes live), one file per piece, named `<channel>-<short-topic>.md`. Each file holds:
- Platform, format, publish date and best time
- Hook, full caption/copy, CTA, hashtags/keywords
- Visual direction or AI image prompt, plus alt text
- Script with timings (video)
- The UTM link to use (for example `?utm_source=instagram&utm_medium=social&utm_campaign=<campaign>`)

## 4. Quality check before saving
Every piece should be on-voice, use customer language, carry a single CTA, respect each platform's character limits and contain no unverifiable claims. Rewrite any piece that fails.

## 5. Finish
Append to `LOG.md`. Reply with the calendar overview (table), the folder path, the production to-do list (what to film or design this week), and: "Each week, run `/hub-grow <slug>` with your numbers."
