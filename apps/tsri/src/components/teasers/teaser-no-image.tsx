import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserNoImage = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.NoImage)({ blockStyle }),
]);

export const TeaserNoImage = styled(TsriTeaser)`
  aspect-ratio: 2.06 !important;
  width: 100%;
  container-type: normal;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --tw: 32.5cqw;
  }

  ${TeaserImageWrapper} {
    display: none;
  }

  ${TeaserContentWrapper} {
    grid-template-rows: 26% 7.9% min-content min-content;
    grid-template-columns: 15.9% 84.1%;
    background-color: ${({ theme }) => theme.palette.primary.dark};
  }

  ${TeaserPreTitleWrapper} {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  ${TeaserPreTitle} {
    padding: calc(var(--tw, 100cqw) * 0.0065) calc(var(--tw, 100cqw) * 0.015);
  }

  ${TeaserTitle} {
    padding: calc(var(--tw, 100cqw) * 0.022) calc(var(--tw, 100cqw) * 0.015)
      calc(var(--tw, 100cqw) * 0.04);
  }

  ${TeaserMetadata} {
    padding: 0 calc(var(--tw, 100cqw) * 0.015) calc(var(--tw, 100cqw) * 0.015)
      calc(var(--tw, 100cqw) * 0.015);
    color: transparent;
  }

  ${TeaserAuthors} {
    color: ${({ theme }) => theme.palette.common.black};
  }

  ${TeaserTime} {
    display: none;
  }
`;
