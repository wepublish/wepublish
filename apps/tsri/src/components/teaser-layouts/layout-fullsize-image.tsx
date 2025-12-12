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
  TeaserLayoutWrapper,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriTeaserType.FullsizeImage;
  },
]);

export const isTeaserSlotsFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriTeaserType.FullsizeImage;
  },
]);

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserLayoutFullsizeImageWrapper = styled(TeaserLayoutWrapper)``;

export const TeaserSlotsFullsizeImage = styled(TeaserSlots)``;

export const TeaserFlexGridFullsizeImage = styled(TeaserFlexGrid)``;
