import {
  hasBlockStyle,
  isTeaserGridBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserGridBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isArchive = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([hasBlockStyle('Archive'), isTeaserGridBlock])(block);
