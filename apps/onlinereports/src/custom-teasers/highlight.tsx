import {styled} from '@mui/material'
import {
  ImageWrapper,
  TeaserLead,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTitle
} from '@wepublish/website'

import {
  OnlineReportsBaseTeaser,
  OnlineReportsTeaserTitleWrapper
} from '../onlinereports-base-teaser'

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

  ${TeaserLead} {
    //font-size: 18px!important;
  }

  ${OnlineReportsTeaserTitleWrapper} {
    //font-size: 44px!important;
    font-weight: 700;
  }

  ${TeaserPreTitleWrapper}, ${TeaserPreTitle} {
    margin-bottom: 0;
    height: unset;
    padding: 0;
    background-color: transparent;
    color: ${({theme}) => theme.palette.accent.main};
    font-weight: 500;
    width: max-content;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitle} {
    transform: unset;
  }

  ${TeaserTitle} {
    font-weight: 800;
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

    ${({theme}) => theme.breakpoints.up('md')} {
      aspect-ratio: 5/3;
      max-height: unset;
    }
  }
`
