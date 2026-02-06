import styled from '@emotion/styled';
import { FlexAlignment } from '@wepublish/website/api';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TsriLayoutType } from './tsri-layout';
import { TeaserLayoutWrapper, TeaserSlots } from './tsri-layout';

export const isTeaserSlotsHeroTeaser = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.HeroTeaser;
  },
]);

export const alignmentForTeaserBlock = (index: number): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 12, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  return {
    ...alignment,
  };
};

export const teaserBlockStyleByIndex = (
  index: number,
  count?: number
): TsriTeaserType => {
  return TsriTeaserType.HeroTeaser;
};

export const TeaserSlotsHeroTeaser = styled(TeaserSlots)`
  aspect-ratio: unset;
  align-items: flex-start;
  golumn-gap: 0;
  row-gap: 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 16 / 9;
  }

  ${TeaserLayoutWrapper} {
    grid-template-columns: 1 / 9;
  }
`;
