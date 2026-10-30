import {
  hasBlockStyle,
  isTeaserGridBlock,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
} from '@wepublish/website/api';
import { allPass, anyPass } from 'ramda';

export const isFrageDesTages = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserListBlockFragment | FullTeaserGridBlockFragment =>
  allPass([
    hasBlockStyle('FrageDesTages'),
    anyPass([isTeaserListBlock, isTeaserGridBlock]),
  ])(block);
