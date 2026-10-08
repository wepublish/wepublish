import { hasBlockStyle, isTitleBlock } from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTitleBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isExtraSpacingTitleBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTitleBlockFragment =>
  allPass([hasBlockStyle('ExtraSpacing'), isTitleBlock])(block);
