import {ImageWrapper, Teaser} from '@wepublish/website'
import {styled} from '@mui/material'

// temporary fix until it's properly fixed
export const SafariBugHotfixTeaser = styled(Teaser)`
  ${ImageWrapper} {
    object-fit: contain;
  }
`
