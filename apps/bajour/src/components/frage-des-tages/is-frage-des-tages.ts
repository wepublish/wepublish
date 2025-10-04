import {
  hasBlockStyle,
  isTeaserListBlock,
} from '@wepublish/block-content/website';
import { BlockContent, TeaserListBlock } from '@wepublish/website/api';
import { allPass } from 'ramda';

export const isFrageDesTages = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlock =>
  allPass([hasBlockStyle('FrageDesTages'), isTeaserListBlock])(block);
