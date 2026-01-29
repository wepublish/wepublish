import styled from '@emotion/styled';
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
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoColAuthor;
  },
]);

export const TeaserTwoColAuthor = styled(TsriTeaser)`
  aspect-ratio: 2.06 !important;

  ${TeaserContentWrapper} {
    grid-template-columns: 50% 50%;
    grid-template-rows: auto 7.8% fit-content(1px) 14.25%;
    background-color: ${({ theme }) => theme.palette.primary.main};
    border-top-left-radius: 25cqw;

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
    width: 41.74cqw;
    margin: auto;

    & img {
      width: 41.74cqw;
      height: 41.74cqw;
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
      padding: 0.65cqw 1.5cqw;
      color: ${({ theme }) => theme.palette.common.white};
      background-color: ${({ theme }) => theme.palette.common.black};
      font-size: calc((9 * 100cqw / 16) * 0.045) !important;
      line-height: calc((9 * 100cqw / 16) * 0.045) !important;
      font-weight: 700 !important;
      height: 3.8cqw;
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
