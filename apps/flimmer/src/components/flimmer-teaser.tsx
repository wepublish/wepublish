import styled from '@emotion/styled'
import {
  Teaser,
  TeaserImageWrapper,
  TeaserPreTitleNoContent,
  TeaserPreTitleWrapper
} from '@wepublish/block-content/website'
import {ImageWrapper} from '@wepublish/image/website'

export const FlimmerTeaser = styled(Teaser)`
  &,
  &:hover {
    ${TeaserPreTitleNoContent},
    ${TeaserPreTitleWrapper} {
      background-color: unset;
    }
  }

  &:hover ${ImageWrapper} {
    transform: unset;
  }

  ${TeaserImageWrapper}:empty {
    min-height: unset;
  }
`
