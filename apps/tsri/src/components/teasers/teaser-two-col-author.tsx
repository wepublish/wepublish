import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserAuthors,
  TeaserAuthorTextWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TeaserTime,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTwoColAuthor = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.TwoColAuthor)({ blockStyle }),
]);

export const TeaserTwoColAuthor = styled(TsriTeaser)`
  aspect-ratio: 2.06 !important;
  width: 100%;
  container-type: normal;

  ${({ theme }) => theme.breakpoints.up('md')} {
    --tw: 32.5cqw;
  }

  ${TeaserContentWrapper} {
    grid-template-columns: 50% 50%;
    grid-template-rows: auto 7.8% fit-content(1px) 14.25%;
    background-color: ${({ theme }) => theme.palette.primary.main};
    border-top-left-radius: calc(var(--tw, 100cqw) * 0.25);

    &:hover {
      ${TeaserAuthors} {
        background-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }
  }

  ${TeaserImageWrapper} {
    display: none;
  }

  ${TeaserAuthorImageWrapper} {
    display: grid;
    z-index: 1;

    aspect-ratio: 1;
    border-radius: 50%;
    grid-column: 1 / 2;
    grid-row: -1 / 1;
    width: calc(var(--tw, 100cqw) * 0.4174);
    margin: auto;

    & img {
      width: calc(var(--tw, 100cqw) * 0.4174);
      height: calc(var(--tw, 100cqw) * 0.4174);
      object-fit: cover !important;
      max-height: unset;
    }
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserMetadata} {
    grid-row: 2 / 3;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    color: transparent;
    background-color: transparent;
    margin: 0;
    padding: 0;

    & ${TeaserAuthors} {
      padding: calc(var(--tw, 100cqw) * 0.0065) calc(var(--tw, 100cqw) * 0.015);
      color: ${({ theme }) => theme.palette.common.white};
      background-color: ${({ theme }) => theme.palette.common.black};
      font-size: calc(var(--tw, 100cqw) * 0.0253125) !important;
      line-height: calc(var(--tw, 100cqw) * 0.0253125) !important;
      font-weight: 700 !important;
      height: calc(var(--tw, 100cqw) * 0.038);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      & ${TeaserAuthorTextWrapper} {
        display: none;
      }
    }

    & ${TeaserTime} {
      display: none;
    }
  }
`;
