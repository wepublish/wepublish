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
  TeaserLayoutWrapper,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.FullsizeImage;
  },
]);

export const isTeaserSlotsFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.FullsizeImage;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserLayoutFullsizeImageWrapper = styled(TeaserLayoutWrapper)``;

export const TeaserSlotsFullsizeImage = styled(TeaserSlots)``;

export const TeaserFlexGridFullsizeImage = styled(TeaserFlexGrid)``;
