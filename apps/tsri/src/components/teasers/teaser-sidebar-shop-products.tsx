import styled from '@emotion/styled';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { sidebarShopProductsTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserShopProducts = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.ShopProducts;
  },
]);

export const StyledTeaserShopProducts = styled(TsriTeaser)`
  aspect-ratio: 3.1818 !important;
  container: unset;
  border-radius: unset;

  ${TeaserContentWrapper} {
    grid-template-columns: calc(var(--sizing-factor) * 8.1cqw) auto;
    grid-template-rows: min-content auto;
    background-color: ${({ theme }) => theme.palette.common.white};
    grid-column-gap: calc(var(--sizing-factor) * 1cqw);
    color: ${({ theme }) => theme.palette.common.black};

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.main};
      color: ${({ theme }) => theme.palette.common.white};
    }
  }

  ${TeaserTitle} {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }

  ${TeaserLead} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }

  ${TeaserImageWrapper} {
    display: grid;
    z-index: 1;
    aspect-ratio: 1;
    grid-column: 1 / 2;
    grid-row: -1 / 1;
    width: calc(var(--sizing-factor) * 6.69cqw);
    margin: auto;
    border-radius: 1cqw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      border-radius: 0.5cqw;
    }

    & img {
      width: auto;
      height: calc(var(--sizing-factor) * 6.69cqw);
      object-fit: cover;
      max-height: unset;
    }
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${TeaserAuthorImageWrapper} {
    display: none;
  }
`;

export const TeaserShopProducts = createWithTheme(
  StyledTeaserShopProducts,
  sidebarShopProductsTheme
);
