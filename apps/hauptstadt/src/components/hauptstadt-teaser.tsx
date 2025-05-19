import styled from '@emotion/styled'
import {
  BaseTeaser,
  TeaserGridBlock,
  TeaserImageWrapper,
  TeaserListBlock,
  TeaserPreTitle,
  TeaserPreTitleNoContent
} from '@wepublish/block-content/website'
import {ImageWrapper} from '@wepublish/image/website'

export const HauptstadtTeaserGrid = styled(TeaserGridBlock)`
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(6)};
`

export const HauptstadtTeaserList = styled(TeaserListBlock)`
  align-items: stretch;
  gap: ${({theme}) => theme.spacing(6)};
`

export const HauptstadtTeaser = styled(BaseTeaser)`
  border-bottom: 1px solid ${({theme}) => theme.palette.primary.main};
  column-gap: ${({theme}) => theme.spacing(5)};
  padding-bottom: ${({theme}) => theme.spacing(6)};

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
`
