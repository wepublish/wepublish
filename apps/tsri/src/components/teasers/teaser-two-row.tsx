import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserImage,
  TeaserImageCaption,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTwoRow = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoRow;
  },
]);

export const TeaserTwoRow = styled(TsriTeaser)`
  aspect-ratio: unset;
  container: unset;

  ${TeaserContentWrapper} {
    align-self: flex-start;
    grid-template-rows: auto min-content auto min-content;
    grid-template-columns: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    & > * {
      grid-column: -1 / 1;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      grid-template-rows: 58.42cqw min-content auto min-content;
    }
  }

  ${TeaserImageWrapper} {
    display: grid;
    z-index: 1;
    aspect-ratio: 1;
    border-top-left-radius: 1.3cqw;
    border-top-right-radius: 1.3cqw;
    grid-column: 1 / 2;
    grid-row: 1 / 2;

    ${TeaserImageCaption} {
      display: none;
    }

    ${TeaserImage} {
      object-fit: cover;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top left;

      ${({ theme }) => theme.breakpoints.up('md')} {
        width: auto;
        max-height: unset;
        height: 58.42cqw;
      }
    }
  }

  ${TeaserPreTitleWrapper} {
    grid-row: 1 / 2;
    z-index: 2;
    align-self: end;
    line-height: 2.3cqw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      line-height: 1cqw;
    }
  }

  ${TeaserPreTitle} {
    display: inline-block;
    font-weight: 700;
    padding: 0.4cqw 1cqw;
    font-size: 2.3cqw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding: 0.2cqw 1cqw;
      font-size: 1cqw;
      line-height: 1cqw;
    }
  }

  ${TeaserTitle} {
    padding: 1.8cqw 1cqw;
    grid-row: 2 / 3;
    font-size: 3.8cqw !important;
    line-height: 4.2cqw !important;
    word-wrap: nowrap;
    text-wrap: wrap;
    white-space: pre-wrap;
    word-break: break-word;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 2.6cqw !important;
      line-height: 2.98cqw !important;
    }
  }

  ${TeaserLead} {
    display: block;
    padding: 0.6cqw 1cqw 3cqw 1cqw;
    margin: 0;
    grid-row: 3 / 4;
    background-color: white;
    height: 100%;
    font-size: 2.5cqw !important;
    line-height: 2.8cqw !important;
    font-weight: 700 !important;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 1.67cqw !important;
      line-height: 1.6cqw !important;
    }
  }

  ${TeaserMetadata} {
    font-size: 2cqw !important;
    line-height: 2.2cqw !important;
    font-weight: 700 !important;
    padding: 0.6cqw 1cqw;
    grid-row: 4 / 5;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 1.05cqw !important;
      line-height: 1.2cqw !important;
      padding: 0.4cqw 1cqw;
    }
  }
`;
