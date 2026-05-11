import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { FazettenBlockStyles } from '../block-styles/fazetten-block-styles';
import {
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
  WepTeaser,
} from './fazetten-teaser';

export const isTeaserLogoWall = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(FazettenBlockStyles.LogoWall)({ blockStyle }),
]);

export const TeaserLogoWall = styled(WepTeaser)`
  aspect-ratio: unset;
  grid-template-rows: minmax(auto, 80px);
  grid-template-columns: 1fr;

  background-color: transparent;
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
    grid-row: 1 / 2;
    grid-column: -1 / 1;
    width: 100%;
    height: 100%;
    margin: 0;
    z-index: 1;

    & > a {
      display: block;
      width: 100%;
      height: 100%;
      text-indent: -9999px;
      overflow: hidden;
    }
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

  ${TeaserPreTitleNoContent} {
    display: none;
  }
`;
