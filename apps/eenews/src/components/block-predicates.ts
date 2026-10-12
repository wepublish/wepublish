import {
  hasBlockStyle,
  isBreakBlock,
  isFlexBlock,
  isRichTextBlock,
  isTeaserGridBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullBreakBlockFragment,
  FullFlexBlockFragment,
  FullRichTextBlockFragment,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

import { EeNewsBlockType } from './block-styles/eenews-block-styles';

export const isFlexSectionBand = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullFlexBlockFragment =>
  allPass([isFlexBlock, hasBlockStyle(EeNewsBlockType.FlexBlockSectionBand)])(
    block
  );

export const isTopNewsCarousel = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserSlotsBlockFragment =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.TopNewsCarousel)])(
    block
  );

export const isAktuellGrid = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserSlotsBlockFragment =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.AktuellGrid)])(
    block
  );

export const isDossierGrid = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserSlotsBlockFragment =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.DossierGrid)])(
    block
  );

export const isRelatedGrid = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserSlotsBlockFragment | FullTeaserListBlockFragment =>
  anyPass([
    allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.RelatedGrid)]),
    allPass([isTeaserListBlock, hasBlockStyle(EeNewsBlockType.RelatedGrid)]),
  ])(block);

export const isTagFilterableGrid = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserSlotsBlockFragment =>
  allPass([
    isTeaserSlotsBlock,
    hasBlockStyle(EeNewsBlockType.TagFilterableGrid),
  ])(block);

export const isAuthorList = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is
  | FullTeaserSlotsBlockFragment
  | FullTeaserGridBlockFragment
  | FullTeaserListBlockFragment =>
  anyPass([
    allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
    allPass([isTeaserGridBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
    allPass([isTeaserListBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
  ])(block);

export const isArticleSupportCallout = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  allPass([isBreakBlock, hasBlockStyle(EeNewsBlockType.ArticleSupportCallout)])(
    block
  );

export const isArticleShareRow = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  allPass([isBreakBlock, hasBlockStyle(EeNewsBlockType.ArticleShareRow)])(
    block
  );

export const isRichTextLead = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullRichTextBlockFragment =>
  allPass([isRichTextBlock, hasBlockStyle(EeNewsBlockType.RichTextLead)])(
    block
  );
