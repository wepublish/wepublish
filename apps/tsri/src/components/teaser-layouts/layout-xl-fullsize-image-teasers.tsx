import styled from '@emotion/styled';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriLayoutType } from './tsri-layout';
import {
  alignmentForTeaserBlock as alignmentFunc,
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

export const TeaserSlotsXLFullsizeImage = styled(TeaserSlots)`
  row-gap: 4cqw;
  grid-template-columns: unset;

  & > * {
    grid-column-start: unset;
    grid-column-end: unset;
    grid-row-start: unset;
    grid-row-end: unset;
    height: 100%;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.25cqw;
    column-gap: 1.25cqw;
    grid-template-columns: repeat(2, calc(50% - 1.25cqw / 2));
  }
`;
