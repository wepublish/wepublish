import {
  hasBlockStyle,
  isTeaserListBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserListBlock } from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

export const isFrageDesTages = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlock =>
  allPass([
    hasBlockStyle('FrageDesTages'),
    anyPass([isTeaserListBlock, isTeaserSlotsBlock]),
  ])(block);
