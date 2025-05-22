import styled from '@emotion/styled'
import {
  AlternatingTeaser,
  BaseTeaser,
  FocusedTeaser,
  FocusTeaser,
  TeaserContentWrapper,
  TeaserGridBlock,
  TeaserImageWrapper,
  TeaserLead,
  TeaserListBlock,
  TeaserListBlockTeasers,
  TeaserMetadata,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTitle,
  TeaserWrapper
} from '@wepublish/block-content/website'
import {ImageWrapper} from '@wepublish/image/website'

import {ABCWhyte} from '../theme'

export const HauptstadtTeaserGrid = styled(TeaserGridBlock)`
  align-items: stretch; // Makes all teasers the same height
  gap: ${({theme}) => theme.spacing(6)};
`

export const HauptstadtTeaserList = styled(TeaserListBlock)`
  ${TeaserListBlockTeasers} {
    align-items: stretch; // Makes all teasers the same height
    gap: ${({theme}) => theme.spacing(6)};
  }
`

export const HauptstadtTeaser = styled(BaseTeaser)`
  border-bottom: 1px solid ${({theme}) => theme.palette.primary.main};
  padding-bottom: ${({theme}) => theme.spacing(6)};
  column-gap: ${({theme}) => theme.spacing(5)};

  ${TeaserMetadata}, ${TeaserPreTitle} {
    font-family: ${ABCWhyte.style.fontFamily};
  }

  && ${TeaserTitle} {
    font-size: ${({theme}) => theme.typography.h4.fontSize};
    line-height: ${({theme}) => theme.typography.h4.lineHeight};
  }

  ${TeaserImageWrapper} {
    margin-bottom: ${({theme}) => theme.spacing(2)};
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  &:hover ${TeaserPreTitle} {
    color: ${({theme}) => theme.palette.accent.contrastText};
    background-color: ${({theme}) => theme.palette.accent.main};
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }

  ${TeaserPreTitleNoContent} {
    grid-area: pretitle;
  }

  ${TeaserPreTitleWrapper} {
    height: auto;
    width: max-content;
  }

  ${TeaserPreTitle} {
    transform: initial;
  }
`

export const HauptstadtAlternatingTeaser = styled(AlternatingTeaser)`
  && ${TeaserLead} {
    font-size: ${({theme}) => theme.typography.h6.fontSize};
    line-height: ${({theme}) => theme.typography.h6.lineHeight};
  }

  // Setting it to 0px instead of "display: none" allows the grid-area to properly size
  // And makes the teaser content properly aligned when there's no pre title
  ${TeaserPreTitleNoContent} {
    height: 0px;
    margin: 0px;
    display: block;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    ${TeaserImageWrapper} {
      margin-bottom: ${({theme}) => theme.spacing(2)};
    }
  }
`

export const HauptstadtFocusTeaser = styled(FocusTeaser)`
  ${TeaserListBlockTeasers} {
    align-items: stretch; // Makes all teasers the same height
    gap: ${({theme}) => theme.spacing(6)};

    ${({theme}) => theme.breakpoints.up('md')} {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  // Ignore TeaserWrapper layout and follow parent columns
  ${TeaserWrapper} {
    grid-column: unset;
    grid-row: unset;
  }

  // We do not want the border for the focused teaser
  ${FocusedTeaser} ${TeaserContentWrapper} {
    border-bottom: unset;
    padding-bottom: unset;
  }

  // Pretitle background is the same as the FocusTeaser background
  ${TeaserPreTitle},
  &:hover ${TeaserPreTitle} {
    color: ${({theme}) => theme.palette.primary.contrastText};
    background-color: ${({theme}) => theme.palette.primary.main};
  }
`
