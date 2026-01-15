import styled from '@emotion/styled';
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
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.NoImage;
  },
]);

export const TeaserNoImage = styled(TsriTeaser)`
  aspect-ratio: 2.06 !important;

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
    padding: 0.65cqw 1.5cqw;
  }

  ${TeaserTitle} {
    padding: 2.2cqw 1.5cqw 4cqw;
  }

  ${TeaserMetadata} {
    padding: 0 1.5cqw;
    color: transparent;
  }

  ${TeaserAuthors} {
    color: ${({ theme }) => theme.palette.common.black};
  }

  ${TeaserTime} {
    display: none;
  }
`;
