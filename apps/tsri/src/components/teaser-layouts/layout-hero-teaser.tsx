import styled from '@emotion/styled';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriLayoutType } from './tsri-layout';
import {
  TeaserFlexGrid,
  TeaserLayoutWrapper,
  TeaserSlots,
} from './tsri-layout';

export const isTeaserFlexGridHeroTeaser = allPass([
  ({ blockStyle }: BuilderTeaserGridFlexBlockProps) => {
    return blockStyle === TsriLayoutType.HeroTeaser;
  },
]);

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

export const TeaserSlotsHeroTeaser = styled(TeaserSlots)`
  aspect-ratio: 16 / 9;
  align-items: flex-start;
  golumn-gap: 0;
  row-gap: 0;

  ${TeaserLayoutWrapper} {
    grid-template-columns: 1 / 9;
  }
`;

export const TeaserFlexGridHeroTeaser = styled(TeaserFlexGrid)``;
