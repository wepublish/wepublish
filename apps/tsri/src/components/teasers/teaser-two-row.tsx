import styled from '@emotion/styled';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { teaserTwoRowTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserImage,
  TeaserImageCaption,
  TeaserImageWrapper,
  TeaserLead,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTwoRow = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoRow;
  },
]);

export const StyledTeaserTwoRow = styled(TsriTeaser)`
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
      grid-template-rows: 46.75cqw min-content auto min-content;
    }
  }

  ${TeaserTitle} {
    padding: 1.8cqw 2cqw;
    font-size: 4.5cqw !important;
    line-height: 4.5cqw !important;
    word-wrap: nowrap;
    text-wrap: wrap;
    white-space: pre-wrap;
    word-break: break-word;

    ${({ theme }) => theme.breakpoints.up('md')} {
      padding-left: 1cqw;
      padding-right: 1cqw;
      font-size: 2.6cqw !important;
      line-height: 3cqw !important;
    }
  }

  ${TeaserLead} {
    font-size: 3.5cqw !important;
    line-height: 4cqw !important;
    font-weight: 700 !important;

    ${({ theme }) => theme.breakpoints.up('md')} {
      font-size: 1.67cqw !important;
      line-height: 2.25cqw !important;
    }
  }

  ${TeaserImageWrapper} {
    display: grid;
    z-index: 1;
    aspect-ratio: 3 / 2;
    border-top-left-radius: 1.3cqw;
    border-top-right-radius: 1.3cqw;
    grid-column: 1 / 2;
    grid-row: 1 / 2;

    ${TeaserImageCaption} {
      display: none;
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      aspect-ratio: 5 / 4;
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
        height: 46.75cqw;
      }
    }
  }

  ${TeaserPreTitleWrapper} {
    grid-row: 1 / 2;
    z-index: 2;
    align-self: end;
    line-height: 2.6cqw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      line-height: 1cqw;
    }
  }
`;

export const TeaserTwoRow = createWithTheme(
  StyledTeaserTwoRow,
  teaserTwoRowTheme
);
