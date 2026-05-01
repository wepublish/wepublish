/**
 * EE News block predicates.
 *
 * Each predicate combines `hasBlockStyle(EeNewsBlockType.X)` with the wepublish block-type
 * guard via `allPass`. Per MP-2, predicates narrow the BlockContent union to the right
 * Builder*Props type; per MP-3, they're consumed via Ramda `cond` in the block renderer.
 *
 * See `~/.claude/projects/-Users-jpp-Git-wepublish-eenews/memory/eenews-system-design.md` Section 2.
 */
import {
  hasBlockStyle,
  isBreakBlock,
  isFlexBlock,
  isRichTextBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import type { BlockContent } from '@wepublish/website/api';
import type {
  BuilderBreakBlockProps,
  BuilderFlexBlockProps,
  BuilderRichTextBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { EeNewsBlockType } from './block-styles/eenews-block-styles';

type BlockTypename = Pick<BlockContent, '__typename'>;

export const isFeaturedLead = (
  block: BlockTypename
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    hasBlockStyle(EeNewsBlockType.FlexBlockFeaturedLead),
    isTeaserSlotsBlock,
  ])(block);

export const isTeaserSlotsStandard = (
  block: BlockTypename
): block is BuilderTeaserSlotsBlockProps =>
  allPass([hasBlockStyle(EeNewsBlockType.TeaserStandard), isTeaserSlotsBlock])(
    block
  );

export const isTeaserSlotsStandardLarge = (
  block: BlockTypename
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    hasBlockStyle(EeNewsBlockType.TeaserStandardLarge),
    isTeaserSlotsBlock,
  ])(block);

export const isTeaserCompactList = (
  block: BlockTypename
): block is BuilderTeaserListBlockProps =>
  allPass([
    hasBlockStyle(EeNewsBlockType.TeaserCompactList),
    isTeaserListBlock,
  ])(block);

export const isSectionHeadFlexBlock = (
  block: BlockTypename
): block is BuilderFlexBlockProps =>
  allPass([hasBlockStyle(EeNewsBlockType.SectionHeadFlexBlock), isFlexBlock])(
    block
  );

export const isTopicStrip = (
  block: BlockTypename
): block is BuilderFlexBlockProps =>
  allPass([hasBlockStyle(EeNewsBlockType.TopicStrip), isFlexBlock])(block);

export const isNewsletterInline = (
  block: BlockTypename
): block is BuilderFlexBlockProps =>
  allPass([hasBlockStyle(EeNewsBlockType.NewsletterInline), isFlexBlock])(
    block
  );

export const isRichTextCallout = (
  block: BlockTypename
): block is BuilderRichTextBlockProps =>
  allPass([
    hasBlockStyle(EeNewsBlockType.RichTextBlockCallout),
    isRichTextBlock,
  ])(block);

export const isSectionBand = (
  block: BlockTypename
): block is BuilderBreakBlockProps =>
  allPass([hasBlockStyle(EeNewsBlockType.BreakBlockSectionBand), isBreakBlock])(
    block
  );
