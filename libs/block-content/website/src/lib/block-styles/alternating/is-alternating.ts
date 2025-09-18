import {
  BlockContent,
  TeaserGridBlock,
  TeaserListBlock,
  TeaserSlotsBlock,
} from '@wepublish/website/api';
import { allPass } from 'ramda';
import { hasBlockStyle } from '../../has-blockstyle';
import { isTeaserGridBlock } from '../../teaser/teaser-grid-block';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { isTeaserListBlock } from '../../teaser/teaser-list-block';
import { isTeaserSlotsBlock } from '../../teaser/teaser-slots-block';

export const isAlternating = hasBlockStyle('Alternating');
export const isAlternatingTeaser = (props: BuilderTeaserProps) =>
  isAlternating(props);

export const isAlternatingTeaserGridBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlock =>
  allPass([isAlternating, isTeaserGridBlock])(block);

export const isAlternatingTeaserListBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserListBlock =>
  allPass([isAlternating, isTeaserListBlock])(block);

export const isAlternatingTeaserSlotsBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserSlotsBlock =>
  allPass([isAlternating, isTeaserSlotsBlock])(block);
