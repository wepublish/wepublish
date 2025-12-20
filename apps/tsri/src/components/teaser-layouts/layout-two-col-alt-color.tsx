import styled from '@emotion/styled';
import {
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriLayoutType } from './tsri-layout';
import {
  alignmentForTeaserBlock as alignmentFunc,
  TeaserFlexGrid,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridTwoColAltColor = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.TwoColAltColor;
  },
]);

export const isTeaserSlotsTwoColAltColor = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.TwoColAltColor;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridTwoColAltColor = styled(TeaserFlexGrid)``;

export const TeaserSlotsTwoColAltColor = styled(TeaserSlots)``;
