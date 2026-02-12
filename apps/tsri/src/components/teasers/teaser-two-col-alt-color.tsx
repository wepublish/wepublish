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
      ${({ theme }) => theme.palette.primary.main},
      color-mix(
        in srgb,
        ${({ theme }) => theme.palette.common.white} 60%,
        ${({ theme }) => theme.palette.primary.main}
      )
    );
  }
`;
