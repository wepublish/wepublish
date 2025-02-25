import {styled} from '@mui/material'
import {
  ImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserTitle
} from '@wepublish/website'

import {OnlineReportsBaseTeaser} from '../onlinereports-base-teaser'

export const HighlightTeaser = styled(OnlineReportsBaseTeaser)`
  grid-column: span 3;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: span 3;
  }

  grid-template-areas:
    'image'
    '. '
    'pretitle'
    'title'
    'lead'
    'tags'
    '.';
  grid-auto-rows: auto;
  grid-template-columns: 1fr;
  column-gap: ${({theme}) => theme.spacing(2.5)};
  row-gap: ${({theme}) => theme.spacing(1)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-areas:
      'image image .'
      'image image pretitle'
      'image image title'
      'image image lead'
      'image image tags'
      'image image .';
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 20px auto auto auto auto auto;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    transform: unset;
  }

  ${TeaserTitle} {
    font-size: 44px;
  }

  ${TeaserLead} {
    &.MuiTypography-gutterBottom,
    & {
      margin-bottom: 0;
    }
  }

  ${TeaserLead} {
    display: block;
  }

  ${TeaserMetadata} {
    display: none;
  }

  ${ImageWrapper} {
    height: 100%;

    ${({theme}) => theme.breakpoints.up('md')} {
      aspect-ratio: 5/3;
      max-height: unset;
    }
  }
`
