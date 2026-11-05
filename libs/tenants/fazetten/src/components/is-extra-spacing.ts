import { hasBlockStyle, isTitleBlock } from '@wepublish/block-content/website';
import {
  FullBlockFragment,
  FullTitleBlockFragment,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

import { FazettenBlockStyles } from './block-styles/fazetten-block-styles';

export const isExtraSpacingTitleBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullTitleBlockFragment =>
  allPass([hasBlockStyle(FazettenBlockStyles.ExtraSpacing), isTitleBlock])(
    block
  );
