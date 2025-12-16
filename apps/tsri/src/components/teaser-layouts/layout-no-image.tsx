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

export const isTeaserFlexGridNoImage = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.NoImage;
  },
]);

export const isTeaserSlotNoImage = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.NoImage;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridNoImage = styled(TeaserFlexGrid)``;

export const TeaserSlotNoImage = styled(TeaserSlots)``;
