import {
  hasBlockStyle,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTeaserGridBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isBestOfWePublish = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([hasBlockStyle('BestOfWePublish'), isTeaserGridBlock])(block);
