import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
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
    grid-template-rows: 58.42cqw min-content auto min-content;
    grid-template-columns: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    & > * {
      grid-column: -1 / 1;
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

    & img {
      width: auto;
      height: 58.42cqw;
      object-fit: cover;
      max-height: unset;
    }
  }

  ${TeaserPreTitleWrapper} {
    grid-row: 1 / 2;
    z-index: 2;
    align-self: end;
  }

  ${TeaserPreTitle} {
    display: inline-block;
    padding: 0.2cqw 1cqw;
    font-size: 1cqw;
    font-weight: 500;
  }

  ${TeaserTitle} {
    padding: 1.8cqw 1cqw;
    grid-row: 2 / 3;
    font-size: 2.6cqw !important;
    line-height: 2.98cqw !important;
    word-wrap: nowrap;
    text-wrap: wrap;
    white-space: pre-wrap;
    word-break: break-word;
  }

  ${TeaserLead} {
    display: block;
    padding: 0.4cqw 1cqw 2cqw 1cqw;
    margin: 0;
    grid-row: 3 / 4;
    background-color: white;
    height: 100%;
    font-size: 1.67cqw !important;
    line-height: 1.6cqw !important;
    font-weight: 700 !important;
  }

  ${TeaserMetadata} {
    font-size: 1.05cqw !important;
    line-height: 1.2cqw !important;
    font-weight: 700 !important;
    padding: 0.4cqw 1cqw;
    grid-row: 4 / 5;
  }
`;
