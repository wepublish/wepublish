import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriLayoutType } from './tsri-layout';
import {
  alignmentForTeaserBlock as alignmentFunc,
  TeaserFlexGrid,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserSlotsXLFullsizeImageTeasers = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.XLFullsizeImage;
  },
]);

export const teaserBlockStyleByIndex = (
  index: number,
  count?: number
): TsriTeaserType => {
  return TsriTeaserType.FullsizeImage;
};

export const alignmentForTeaserBlock = alignmentFunc;

export const TeaserFlexGridXLFullsizeImage = styled(TeaserFlexGrid)``;

export const TeaserSlotsXLFullsizeImage = styled(TeaserSlots)`
  column-gap: 1.25cqw;
  row-gap: 1.25cqw;
`;
