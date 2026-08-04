import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent, FullBreakBlockFragment } from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isInstagramBanner = (
  block: Pick<BlockContent, '__typename'>
): block is FullBreakBlockFragment =>
  allPass([hasBlockStyle('Instagram'), isBreakBlock])(block);
