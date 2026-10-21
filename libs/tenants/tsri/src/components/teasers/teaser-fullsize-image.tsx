import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import { TsriTeaser } from './tsri-teaser';

export const isTeaserFullsizeImage = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.FullsizeImage)({ blockStyle }),
]);

export const TeaserFullsizeImage = styled(TsriTeaser)``;
