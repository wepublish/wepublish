import { hasBlockStyle, isTitleBlock } from '@wepublish/block-content/website';
import { BlockContent, FullTitleBlockFragment } from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isExtraSpacingTitleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullTitleBlockFragment =>
  allPass([hasBlockStyle('ExtraSpacing'), isTitleBlock])(block);
