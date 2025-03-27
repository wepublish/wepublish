import {
  TeaserLead,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserTitle
} from '@wepublish/block-content/website'

import {OnlineReportsBaseTeaser} from '../onlinereports-base-teaser'
import styled from '@emotion/styled'

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
    'authors'
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
      'image image authors'
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
    font-size: ${({theme}) => theme.typography.h1.fontSize};
    font-family: ${({theme}) => theme.typography.h1.fontFamily};
    font-weight: ${({theme}) => theme.typography.h1.fontWeight};
    ${({theme}) => theme.breakpoints.up('md')} {
      font-size: 44px;
    }
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
`
