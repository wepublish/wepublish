import styled from '@emotion/styled';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { sidebarShopProductsTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserContentWrapper,
  TeaserImageCaption,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitleNoContent,
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
  aspect-ratio: unset !important;
  container: unset;
  border-radius: unset;
  padding: 0;
  margin: 0;

  ${TeaserContentWrapper} {
    grid-template-columns: calc(var(--sizing-factor) * 8.1cqw) auto;
    grid-template-rows: auto min-content;
    background-color: ${({ theme }) => theme.palette.common.white};
    grid-column-gap: calc(var(--sizing-factor) * 1cqw);
    color: ${({ theme }) => theme.palette.common.black};
    padding: calc(var(--sizing-factor) * 0.75cqw) 0;

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.main};
      color: ${({ theme }) => theme.palette.common.white};
    }
  }

  ${TeaserTitle} {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    padding: 0;
  }

  ${TeaserLead} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    margin: 0;
    padding: 0;
    align-self: start;
  }

  ${TeaserImageCaption} {
    display: none;
  }

  ${TeaserImageWrapper} {
    display: grid;
    z-index: 1;
    aspect-ratio: 1;
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    width: calc(var(--sizing-factor) * 6.7cqw);
    margin: auto;
    border-radius: 1cqw;
    position: relative;

    ${({ theme }) => theme.breakpoints.up('md')} {
      border-radius: 0.5cqw;
    }

    & picture {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: hidden;
    }

    & img {
      max-width: 100%;
      max-height: 100%;
      width: 100%;
      height: 100%;
      object-fit: cover;
      aspect-ratio: unset;
    }
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitleNoContent} {
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
