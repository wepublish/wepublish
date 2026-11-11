import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { createWithTheme } from '@wepublish/ui';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { sidebarTsriLoveTheme } from '../../theme';
import { TsriTeaserType } from './tsri-base-teaser';
import {
  TeaserAuthorImageWrapper,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserMetadata,
  TeaserPreTitleWrapper,
  TsriTeaser,
} from './tsri-teaser';

export const isTeaserTsriLove = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(TsriTeaserType.TsriLove)({ blockStyle }),
]);

export const TeaserTsriLoveStyled = styled(TsriTeaser)`
  aspect-ratio: unset !important;
  container: unset;
  border-radius: 0 !important;

  ${TeaserContentWrapper} {
    display: block;
    background-color: ${({ theme }) => theme.palette.common.white};
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

export const TeaserTsriLove = createWithTheme(
  TeaserTsriLoveStyled,
  sidebarTsriLoveTheme
);
