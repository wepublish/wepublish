import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TeaserTwoCol } from './teaser-two-col';
import { TsriTeaserType } from './tsri-base-teaser';
import { TeaserMetadata } from './tsri-teaser';

export const isTeaserTwoColNoMeta = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoColNoMeta;
  },
]);

export const TeaserTwoColNoMeta = styled(TeaserTwoCol)`
  ${TeaserMetadata} {
    display: none;
  }
`;
