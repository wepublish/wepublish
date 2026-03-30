import { hasBlockStyle, isTitleBlock } from '@wepublish/block-content/website';
import { BlockContent, TitleBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isExtraSpacingTitleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TitleBlock =>
  allPass([hasBlockStyle('ExtraSpacing'), isTitleBlock])(block);
