import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import {
  ReflektTeaser,
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
} from './reflekt-teaser';

export const isTeaserLogoWall = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(ReflektBlockStyles.TeaserLogoWall)({ blockStyle }),
]);

export const TeaserLogoWall = styled(ReflektTeaser)`
  aspect-ratio: unset;
  grid-template-rows: min-content;
  grid-template-columns: 1fr;

  background-color: transparent;
  padding: 0;
  row-gap: 0;
  cursor: default;

  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: visible;

  ${TeaserContentWrapper} {
    position: relative;

    &:hover {
      background-color: transparent;
    }
  }

  ${TeaserImageWrapper} {
    grid-row: 1 / 2;
    display: grid;
    margin: 0;

    img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  }

  ${TeaserTitle} {
    position: absolute;
    inset: 0;
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
