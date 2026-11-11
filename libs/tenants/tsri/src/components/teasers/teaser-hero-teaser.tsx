import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
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
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.HeroTeaser)({ blockStyle }),
]);

export const StyledTeaserHeroTeaser = styled(TsriTeaser)`
  container-type: normal;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --tw: 63.7cqw;
  }

  ${({ theme }) => theme.breakpoints.down('md')} {
    aspect-ratio: unset;

    ${TeaserContentWrapper} {
      aspect-ratio: unset;
      grid-template-rows: auto auto auto auto;
      grid-template-columns: 34% 66%;
      grid-column: -1 / 1;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      padding-bottom: calc(var(--tw, 100cqw) * 0.08);
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
      aspect-ratio: 3 / 2;
      grid-row: 1 / 3;
      padding: calc(var(--tw, 100cqw) * 0.02) calc(var(--tw, 100cqw) * 0.02) 0
        calc(var(--tw, 100cqw) * 0.02);
      z-index: 1;

      & img {
        aspect-ratio: 3 / 2;
        object-fit: cover;
        object-position: left center;
        width: 100%;
        height: 100%;
        border-radius: calc(var(--tw, 100cqw) * 0.0175);
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
