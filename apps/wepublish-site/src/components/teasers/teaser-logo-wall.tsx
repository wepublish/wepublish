import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { WepBlockStyles } from '../block-styles/wep-block-styles';
import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  WepTeaser,
} from './wep-teaser';

export const isTeaserLogoWall = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(WepBlockStyles.LogoWall)({ blockStyle }),
]);

export const TeaserLogoWall = styled(WepTeaser)`
  aspect-ratio: unset;
  grid-template-rows: minmax(auto, 200px);
  grid-template-columns: 1fr;

  background-color: ${({ theme }) => theme.palette.primary.light};
  padding: 0;
  row-gap: 0;

  cursor: default;

  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-column-start: unset;
    grid-column-end: unset;
    grid-row-start: unset;
    grid-row-end: unset;
  }

  ${TeaserContentWrapper} {
    display: contents;
  }

  ${TeaserImageWrapper} {
    grid-row: 1 / 2;
  }

  ${TeaserTitle} {
    display: none;
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitle} {
    display: none;
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${TeaserAuthors} {
    display: none;
  }

  ${TeaserTime} {
    display: none;
  }
`;
