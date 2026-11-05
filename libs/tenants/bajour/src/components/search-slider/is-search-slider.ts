import {
  hasBlockStyle,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTeaserListBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isSearchSlider = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTeaserListBlockFragment =>
  allPass([hasBlockStyle('SearchSlider'), isTeaserListBlock])(block);
