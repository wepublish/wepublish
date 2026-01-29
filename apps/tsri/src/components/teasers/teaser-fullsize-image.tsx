import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import { TsriTeaser } from './tsri-teaser';

export const isTeaserFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.FullsizeImage;
  },
]);

export const TeaserFullsizeImage = styled(TsriTeaser)``;
