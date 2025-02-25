import {Box, css, styled, useTheme} from '@mui/material'
import {
  Teaser,
  TeaserAuthors,
  TeaserLead,
  TeaserPreTitle,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper,
  TeaserTags,
  TeaserTime,
  TeaserTitle,
  TeaserWrapper
} from '@wepublish/website'
import {useMemo} from 'react'

export const useImageStyles = () => {
  const theme = useTheme()

  return useMemo(
    () => css`
      max-height: 400px;
      width: 100%;
      object-fit: cover;
      grid-column: 1/13;
      transition: transform 0.3s ease-in-out;
      aspect-ratio: 4/3;

      :where(${TeaserWrapper}:hover &) {
        transform: scale(1);
      }

      ${theme.breakpoints.up('md')} {
        aspect-ratio: 4/3;
      }
    `,
    [theme]
  )
}

export const OnlineReportsTeaserTitleWrapper = styled('h2')`
  grid-area: title;
  font-size: 24px !important;
`

export const OnlineReportsTeaserPreTitleWrapper = styled(Box)``

export const OnlineReportsBaseTeaser = styled(Teaser)`
  color: inherit;
  text-decoration: none;
  display: grid;

  grid-template-areas:
    'image'
    '.'
    'pretitle'
    'title'
    'lead'
    'tags'
    'authors';
  grid-template-rows: auto 12px auto auto auto auto;

  .MuiChip-root {
    color: inherit;
    border-color: inherit;
  }

  ${TeaserPreTitleNoContent} {
    display: none;
  }

  ${TeaserPreTitleWrapper} {
    margin-bottom: 0;
    padding: 0;
    height: unset;
    color: ${({theme}) => theme.palette.primary.main};
    background-color: transparent;
    grid-area: pretitle;
  }

  ${TeaserPreTitle} {
    transform: none;
    padding: 0;
    background-color: transparent;
    color: ${({theme}) => theme.palette.primary.main};
    font-weight: 600;
    width: max-content;
  }

  ${TeaserTitle} {
    ${({theme}) => theme.typography.h3};
  }

  ${TeaserLead} {
    display: none;
  }

  ${TeaserTags} {
    display: none;
  }

  ${TeaserAuthors} {
    ${({theme}) => theme.typography.body2};
  }

  ${TeaserTime} {
    display: none;
  }
`
