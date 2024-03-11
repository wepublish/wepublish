import {styled} from '@mui/material'
import {ImageWrapper, Teaser} from '@wepublish/website'

// temporary fix until it's properly fixed
export const SafariBugHotfixTeaser = styled(Teaser)`
  grid-template-rows: initial;

  ${ImageWrapper} {
    height: auto;
    object-fit: contain;
  }
`
