import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTsriLove = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserType.TsriLove;
  },
]);

export const TeaserTsriLove = styled(TsriTeaser)`
  aspect-ratio: unset !important;
  container: unset;
  border-radius: 0 !important;

  ${TeaserContentWrapper} {
    display: block;
    background-color: ${({ theme }) => theme.palette.common.white};

    ${TeaserTitle} {
      &.MuiTypography-root {
        color: ${({ theme }) => theme.palette.common.black};
        font-size: 1.3cqw !important;
        line-height: 1.49cqw !important;
        font-weight: 700 !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      & a {
        color: inherit;
        text-decoration: none;
        padding: 0.5cqw;
        display: block;
        background-color: ${({ theme }) => theme.palette.common.white};

        &:hover {
          background-color: ${({ theme }) => theme.palette.primary.light};
          color: ${({ theme }) => theme.palette.common.black};
        }
      }
    }
  }

  ${TeaserImageWrapper} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserAuthorImageWrapper} {
    display: none;
  }

  ${TeaserMetadata} {
    display: none;
  }
`;
