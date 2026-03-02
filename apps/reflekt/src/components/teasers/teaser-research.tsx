import styled from '@emotion/styled';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../reflekt-block-types';
import {
  ReflektTeaser,
  TeaserContentWrapper,
  TeaserImage,
  TeaserImageInnerWrapper,
  TeaserImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserTitle,
} from './reflekt-teaser';

export const isTeaserResearch = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === ReflektBlockType.TeaserResearch;
  },
]);

export const TeaserResearch = styled(ReflektTeaser)`
  aspect-ratio: 365/528;

  ${TeaserContentWrapper} {
    grid-template-rows: 10% auto min-content;
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
  }

  ${TeaserMetadata} {
    display: none;
  }
`;
