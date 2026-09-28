import {
  hasBlockStyle,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserGridBlockFragment,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

export enum BriefingType {
  BaselBriefing = 'BaselBriefing',
  FCBBriefing = 'FCBBriefing',
  FasnachtsBriefing = 'FasnachtsBriefing',
  EscBriefing = 'EscBriefing',
}

export const isBaselBriefingIgnoringBlockType = (
  block: Pick<BlockContent, 'blockStyle'>
) => hasBlockStyle(BriefingType.BaselBriefing)(block);

export const isBaselBriefing = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([isBaselBriefingIgnoringBlockType, isTeaserGridBlock])(block);

export const isFCBBriefing = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([hasBlockStyle(BriefingType.FCBBriefing), isTeaserGridBlock])(block);

export const isFasnachtsBriefing = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([hasBlockStyle(BriefingType.FasnachtsBriefing), isTeaserGridBlock])(
    block
  );

export const isEscBriefing = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([hasBlockStyle(BriefingType.EscBriefing), isTeaserGridBlock])(block);

export const isAnyBriefing = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  anyPass([isBaselBriefing, isFCBBriefing, isFasnachtsBriefing, isEscBriefing])(
    block
  );
