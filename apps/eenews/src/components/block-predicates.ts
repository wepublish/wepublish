import {
  hasBlockStyle,
  isBreakBlock,
  isFlexBlock,
  isRichTextBlock,
  isTeaserGridBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  BuilderFlexBlockProps,
  BuilderRichTextBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass, anyPass } from 'ramda';

import { EeNewsBlockType } from './block-styles/eenews-block-styles';

export const isFlexSectionBand = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps =>
  allPass([isFlexBlock, hasBlockStyle(EeNewsBlockType.FlexBlockSectionBand)])(
    block
  );

export const isTopNewsCarousel = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.TopNewsCarousel)])(
    block
  );

export const isAktuellGrid = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.AktuellGrid)])(
    block
  );

export const isDossierGrid = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.DossierGrid)])(
    block
  );

export const isRelatedGrid = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps | BuilderTeaserListBlockProps =>
  anyPass([
    allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.RelatedGrid)]),
    allPass([isTeaserListBlock, hasBlockStyle(EeNewsBlockType.RelatedGrid)]),
  ])(block);

export const isTagFilterableGrid = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    isTeaserSlotsBlock,
    hasBlockStyle(EeNewsBlockType.TagFilterableGrid),
  ])(block);

export const isAuthorList = (
  block: Pick<BlockContent, '__typename'>
): block is
  | BuilderTeaserSlotsBlockProps
  | BuilderTeaserGridBlockProps
  | BuilderTeaserListBlockProps =>
  anyPass([
    allPass([isTeaserSlotsBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
    allPass([isTeaserGridBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
    allPass([isTeaserListBlock, hasBlockStyle(EeNewsBlockType.AuthorList)]),
  ])(block);

export const isArticleSupportCallout = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(EeNewsBlockType.ArticleSupportCallout)])(
    block
  );

export const isArticleShareRow = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([isBreakBlock, hasBlockStyle(EeNewsBlockType.ArticleShareRow)])(
    block
  );

export const isRichTextLead = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderRichTextBlockProps =>
  allPass([isRichTextBlock, hasBlockStyle(EeNewsBlockType.RichTextLead)])(
    block
  );
