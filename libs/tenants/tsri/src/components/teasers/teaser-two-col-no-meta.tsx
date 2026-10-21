import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserTwoCol } from './teaser-two-col';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserMetadata } from './tsri-teaser';

export const isTeaserTwoColNoMeta = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.TwoColNoMeta)({ blockStyle }),
]);

export const TeaserTwoColNoMeta = styled(TeaserTwoCol)`
  ${TeaserMetadata} {
    display: none;
  }
`;
