import {
  hasBlockStyle,
  isTeaserGridBlock,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

export const isFrageDesTages = (
  block: Pick<BlockContent, '__typename'>
): block is FullTeaserListBlockFragment | FullTeaserGridBlockFragment =>
  allPass([
    hasBlockStyle('FrageDesTages'),
    anyPass([isTeaserListBlock, isTeaserGridBlock]),
  ])(block);
