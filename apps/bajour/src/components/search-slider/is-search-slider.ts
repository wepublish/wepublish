import {
  hasBlockStyle,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserListBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isSearchSlider = (
  block: Pick<BlockContent, '__typename'>
): block is FullTeaserListBlockFragment =>
  allPass([hasBlockStyle('SearchSlider'), isTeaserListBlock])(block);
