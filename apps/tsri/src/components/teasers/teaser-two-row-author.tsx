import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserAuthors,
  TeaserAuthorTextWrapper,
  TeaserAuthorWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTwoRowAuthor = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoRowAuthor;
  },
]);

export const TeaserTwoRowAuthor = styled(TsriTeaser)`
  aspect-ratio: unset;
  container: unset;

  ${TeaserContentWrapper} {
    align-self: flex-start;
    grid-template-rows: 46.75cqw 6.977cqw 7.5cqw auto min-content;
    grid-template-columns: 15.4cqw auto;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    & > * {
      grid-column: -1 / 1;
    }

    &:hover {
      ${TeaserAuthorWrapper} {
        background-color: ${({ theme }) =>
          theme.palette.primary.light} !important;
        color: ${({ theme }) => theme.palette.common.black} !important;
      }
    }
  }

  ${TeaserImageWrapper} {
    display: grid;
    aspect-ratio: 3 / 2;
    border-top-left-radius: 1.3cqw;
    border-top-right-radius: 1.3cqw;
    grid-column: -1 / 1;
    grid-row: 1 / 3;
    overflow: visible;

    & img {
      width: auto;
      height: 53.727cqw;
      object-fit: cover;
      max-height: unset;
    }
  }

  ${TeaserAuthorImageWrapper} {
    display: block;
    aspect-ratio: 1;
    border-radius: unset;
    border-top-left-radius: 50%;
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    padding: 1cqw;
    background-color: ${({ theme }) => theme.palette.common.white};

    & img {
      width: 13.42cqw;
      height: 13.42cqw;
      object-fit: cover !important;
      max-height: unset;
      border-radius: 50%;
    }
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserTitle} {
    padding: 1.8cqw 1cqw;
    grid-column: 2 / 3;
    grid-row: 2 / 4;
    font-size: 4.5cqw !important;
    line-height: 4.5cqw !important;
    word-wrap: nowrap;
    text-wrap: wrap;
    white-space: pre-wrap;
    word-break: break-word;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 2.6cqw !important;
      line-height: 3cqw !important;
    }
  }

  ${TeaserLead} {
    display: block;
    padding: 2cqw 1cqw 6cqw 1cqw;
    margin: 0;
    grid-row: 4 / 6;
    background-color: ${({ theme }) => theme.palette.common.white};
    height: 100%;
    font-size: 3.5cqw !important;
    line-height: 4cqw !important;
    font-weight: 700 !important;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 2cqw 1cqw 4.5cqw 1cqw;
      font-size: 1.67cqw !important;
      line-height: 2.25cqw !important;
    }
  }

  ${TeaserMetadata} {
    grid-row: 1 / 6;
    grid-column: 1 / 3;
    display: grid;
    grid-template-rows: subgrid;
    background-color: transparent;
    color: transparent;
    user-select: none;
    row-gap: 0;
    pointer-events: none;

    & > * {
      display: none;
    }

    ${TeaserAuthors} {
      grid-row: 1 / 2;
      grid-column: 1 / 3;
      z-index: 2;
      align-self: end;
      display: flex;
      margin: 0;
      padding: 0;
      height: min-content;

      ${TeaserAuthorWrapper} {
        color: ${({ theme }) => theme.palette.common.white};
        background-color: ${({ theme }) => theme.palette.common.black};
        display: inline-block;
        padding: 0.2cqw 1cqw;
        font-size: 2.6cqw;
        font-weight: 700 !important;
        margin-left: 7.2cqw;

        ${({ theme }) => theme.breakpoints.up('md')} {
          font-size: 1.2cqw;
          padding: 0.3cqw 1cqw;
        }
      }

      & ${TeaserAuthorTextWrapper} {
        display: none;
      }
    }

    ${TeaserTime} {
      grid-row: 2 / 6;
      font-size: 2.5cqw !important;
      line-height: 2.5cqw !important;
      font-weight: 700 !important;
      padding: 0.6cqw 1cqw;
      display: block;
      color: ${({ theme }) => theme.palette.common.black};
      margin-left: -1.5cqw;
      z-index: 2;
      align-self: end;
      background-color: ${({ theme }) => theme.palette.common.white};

      ${({ theme }) => theme.breakpoints.up('md')} {
        font-size: 1.05cqw !important;
        line-height: 1.2cqw !important;
        padding: 0.4cqw 1cqw;
      }
    }
  }
`;
