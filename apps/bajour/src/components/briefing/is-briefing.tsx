import {
  hasBlockStyle,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserGridBlock } from '@wepublish/website/api';
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
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([isBaselBriefingIgnoringBlockType, isTeaserGridBlock])(block);

export const isFCBBriefing = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FCBBriefing), isTeaserGridBlock])(block);

export const isFasnachtsBriefing = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.FasnachtsBriefing), isTeaserGridBlock])(
    block
  );

export const isEscBriefing = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([hasBlockStyle(BriefingType.EscBriefing), isTeaserGridBlock])(block);

export const isAnyBriefing = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  anyPass([isBaselBriefing, isFCBBriefing, isFasnachtsBriefing, isEscBriefing])(
    block
  );
