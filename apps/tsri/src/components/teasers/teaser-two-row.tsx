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
  TeaserPreTitleWrapper,
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
