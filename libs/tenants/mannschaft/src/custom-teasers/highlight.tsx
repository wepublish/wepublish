import styled from '@emotion/styled';
import {
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
} from '@wepublish/block-content/website';
import { ImageWrapper } from '@wepublish/image/website';

import { MannschaftBaseTeaser } from '../mannschaft-base-teaser';

export const HighlightTeaser = styled(MannschaftBaseTeaser)`
  background-color: #000;
  color: #fff;
  grid-template-areas:
    'image image image'
    '. pretitle .'
    '. title .'
    '. lead .'
    '. tags .'
    '. . .';
  grid-auto-rows: auto;
  grid-template-columns: 0 1fr 0;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-areas:
      'image . .'
      'image pretitle .'
      'image title .'
      'image lead .'
      'image tags .'
      'image . .';
    grid-template-columns: 2fr 1fr 0;
    column-gap: ${({ theme }) => theme.spacing(4)};
  }

  ${TeaserPreTitleWrapper} {
    margin-bottom: 0;
    height: unset;
    color: #000;
    width: max-content;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    transform: unset;
  }

  ${TeaserLead} {
    &.MuiTypography-gutterBottom,
    & {
      margin-bottom: 0;
    }
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${ImageWrapper} {
    height: 100%;

    ${({ theme }) => theme.breakpoints.up('md')} {
      aspect-ratio: 5/3;
      max-height: unset;
    }
  }
`;
