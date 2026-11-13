---
title: Your RSS feeds now carry the full article text
lead: The RSS, Atom and JSON feeds of your website now contain the whole article instead of just the lead, so media databases such as the Schweizer Mediendatenbank (SMD) and feed readers receive your complete text.
actionRequired: false
---

Until now, every feed item contained only the lead of the article. From now on it carries the article itself:

- the text, with its subtitles and quotes
- images with their captions

The feeds are available at `/rss.xml`, `/atom.xml` and `/feed.json` (older addresses keep working). Media databases such as the Schweizer Mediendatenbank pick up new articles from these feeds, so your articles now arrive there in full.

Free articles always appear in full. For articles behind an active paywall you decide what the feeds show, under **Settings → Feeds**:

- **Lead only** (default): paywalled articles stay as they were
- **The part shown before the paywall**: the same part a reader without a subscription sees on your website
- **The whole text**

Articles you take over from another We.Publish medium always appear with their lead only. A change shows in the feeds within ten minutes.
