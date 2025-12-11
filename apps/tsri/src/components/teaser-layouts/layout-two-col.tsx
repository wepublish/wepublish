import styled from '@emotion/styled';
import {
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import {
  alignmentForTeaserBlock as alignmentFunc,
  TeaserFlexGrid,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridTwoCol = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriTeaserType.TwoCol;
  },
]);

export const isTeaserSlotsTwoCol = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriTeaserType.TwoCol;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridTwoCol = styled(TeaserFlexGrid)``;

export const TeaserSlotsTwoCol = styled(TeaserSlots)``;
