/**
 * EeNewsBlockType — single source of truth for all block-style values used in EE News.
 *
 * Editors set these strings in the CMS as the `blockStyle` field on TeaserSlots / FlexBlock /
 * RichTextBlock / BreakBlock. Code references members via `EeNewsBlockType.X` — never as bare
 * string literals (per MP-1 in `wepublish-redesign-patterns.md`).
 *
 * See `~/.claude/projects/-Users-jpp-Git-wepublish-eenews/memory/eenews-system-design.md` Section 1.
 */
export enum EeNewsBlockType {
  // Hero / featured layouts (visible on home)
  FlexBlockFeaturedLead = 'FlexBlockFeaturedLead', // 2-col image+text lead story

  // Teaser variants (visible on home + article-related)
  TeaserStandard = 'TeaserStandard', // 4:3 image, eyebrow, display title, body lead
  TeaserStandardLarge = 'TeaserStandardLarge', // 16:10 image, larger title (size="lg")
  TeaserCompactList = 'TeaserCompactList', // index + title + meta + arrow row

  // Section composition (visible on home + article-related)
  SectionHeadFlexBlock = 'SectionHeadFlexBlock', // eyebrow + display + action link, 2px ink underline
  TopicStrip = 'TopicStrip', // 4 paper-warm cards with colored tops

  // Inline calls-to-action
  NewsletterInline = 'NewsletterInline', // ink card with email form

  // Article body block-styles (visible in article body)
  RichTextBlockCallout = 'RichTextBlockCallout', // section bg + accent-deep border-left aside

  // Section bands
  BreakBlockSectionBand = 'BreakBlockSectionBand', // sage section bg wrapper for Dossiers / Related
}
