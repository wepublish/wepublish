import styled from '@emotion/styled';
import { hasBlockStyle } from '@wepublish/block-content/website';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import {
  ReflektTeaser,
  TeaserAuthors,
  TeaserContentWrapper,
  TeaserImage,
  TeaserImageInnerWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTime,
  TeaserTitle,
} from './reflekt-teaser';

export const isTeaserRecherchen =
  hasBlockStyle(ReflektBlockType.TeaserRecherchen) ||
  hasBlockStyle(ReflektBlockType.TeaserRecherchenGrid);

export const TeaserRecherchen = styled(ReflektTeaser)`
  aspect-ratio: 365/528;

  ${TeaserContentWrapper} {
    grid-template-rows: 10% auto min-content min-content;
    row-gap: 0;
    background-color: transparent;

    &:hover {
      background-color: transparent;
    }
  }

  ${TeaserTitle} {
    visibility: hidden;

    & > a:after {
      visibility: visible;
    }
  }

  ${TeaserImageWrapper} {
    display: block;
    grid-row: 1 / 4;
    grid-column: -1 / 1;
    padding: 0;
    margin: 0;
    overflow: hidden;
    z-index: -1;
    position: relative;
  }

  ${TeaserImageInnerWrapper} {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  ${TeaserImage} {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    aspect-ratio: unset;
  }

  ${TeaserLead} {
    grid-row: 3 / 4;
    visibility: hidden;
  }

  ${TeaserMetadata} {
    grid-row: 3 / 4;
    display: block;
    visibility: hidden;
    position: absolute;

    ${TeaserAuthors} {
      display: block;
      visibility: hidden;
    }

    ${TeaserTime} {
      visibility: hidden;
    }
  }

  ${TeaserPreTitleWrapper} {
    display: none;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    display: none;
  }
`;
