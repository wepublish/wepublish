import styled from '@emotion/styled';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { teaserHeroTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserHeroTeaser = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.HeroTeaser;
  },
]);

export const StyledTeaserHeroTeaser = styled(TsriTeaser)`
  ${({ theme }) => theme.breakpoints.down('md')} {
    aspect-ratio: unset;

    ${TeaserContentWrapper} {
      aspect-ratio: unset;
      grid-template-rows: auto auto auto auto;
      grid-template-columns: 34% 66%;
      grid-column: -1 / 1;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      padding-bottom: 8cqw;
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

    ${TeaserImageWrapper} {
      aspect-ratio: 1 / 1;
      grid-row: 1 / 3;
      padding: 2cqw 2cqw 0 2cqw;
      z-index: 1;

      & img {
        aspect-ratio: 1 / 1;
        object-fit: cover;
        width: 100%;
        height: 100%;
        border-radius: 1.75cqw;
      }
    }

    ${TeaserPreTitleWrapper} {
      grid-row: 2 / 3;
      z-index: 2;
    }

    ${TeaserTitle} {
      grid-row: 3 / 4;
    }

    ${TeaserMetadata} {
      grid-row: 4 / 5;
    }
  }
`;

export const TeaserHeroTeaser = createWithTheme(
  StyledTeaserHeroTeaser,
  teaserHeroTheme
);
