import {
  hasBlockStyle,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserListBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isFrageDesTages = (
  block: Pick<BlockContent, '__typename'>
): block is FullTeaserListBlockFragment =>
  allPass([hasBlockStyle('FrageDesTages'), isTeaserListBlock])(block);
