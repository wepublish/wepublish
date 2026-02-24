import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTwoCol = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TwoCol;
  },
]);

export const TeaserTwoCol = styled(TsriTeaser)`
  aspect-ratio: 2.06 !important;

  ${TeaserContentWrapper} {
    grid-template-columns: 50% 50%;
    grid-template-rows: auto 7.8% fit-content(1px) 14.25%;
    background-color: ${({ theme }) => theme.palette.primary.dark};
  }

  ${TeaserImageWrapper} {
    display: grid;
    z-index: 1;

    aspect-ratio: 1;
    border-radius: 1.3cqw;
    grid-column: 1 / 2;
    grid-row: -1 / 1;
    width: 41.74cqw;
    margin: auto;

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
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  ${TeaserPreTitle} {
    padding: 0.65cqw 1.5cqw;
  }

  ${TeaserMetadata} {
    display: none;
  }
`;
