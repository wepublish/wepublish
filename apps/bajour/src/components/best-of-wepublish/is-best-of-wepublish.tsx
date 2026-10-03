import {
  hasBlockStyle,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserGridBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isBestOfWePublish = (
  block: Partial<Pick<BlockContent, '__typename'>>
): block is FullTeaserGridBlockFragment =>
  allPass([hasBlockStyle('BestOfWePublish'), isTeaserGridBlock])(block);
