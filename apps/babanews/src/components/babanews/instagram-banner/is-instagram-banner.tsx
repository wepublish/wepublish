import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullBreakBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isInstagramBanner = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullBreakBlockFragment =>
  allPass([hasBlockStyle('Instagram'), isBreakBlock])(block);
