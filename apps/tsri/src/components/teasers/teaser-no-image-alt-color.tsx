import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserNoImage } from './teaser-no-image';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserContentWrapper } from './tsri-teaser';

export const isTeaserNoImageAltColor = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.NoImageAltColor;
  },
]);

export const TeaserNoImageAltColor = styled(TeaserNoImage)`
  ${TeaserContentWrapper} {
    background: linear-gradient(
      to bottom,
      rgb(12, 159, 237),
      color-mix(in srgb, white 40%, rgb(12, 159, 237))
    );
  }
`;
