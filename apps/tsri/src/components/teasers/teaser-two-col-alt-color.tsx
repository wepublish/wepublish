import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserTwoCol } from './teaser-two-col';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserContentWrapper } from './tsri-teaser';

export const isTeaserTwoColAltColor = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoColAltColor;
  },
]);

export const TeaserTwoColAltColor = styled(TeaserTwoCol)`
  ${TeaserContentWrapper} {
    background: linear-gradient(
      to bottom,
      rgb(12, 159, 237),
      color-mix(in srgb, white 40%, rgb(12, 159, 237))
    );
  }
`;
