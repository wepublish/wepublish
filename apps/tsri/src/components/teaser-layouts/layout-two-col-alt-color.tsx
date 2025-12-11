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

export const isTeaserFlexGridTwoColAltColor = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriTeaserType.TwoColAltColor;
  },
]);

export const isTeaserSlotTwoColAltColor = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriTeaserType.TwoColAltColor;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridTwoColAltColor = styled(TeaserFlexGrid)``;

export const TeaserSlotTwoColAltColor = styled(TeaserSlots)``;
