import {styled} from '@mui/material'
import {FocusedTeaserContent, FocusTeaser} from '@wepublish/website'

export const MannschaftFocusTeaser = styled(FocusTeaser)`
  ${FocusedTeaserContent} {
    color: ${({theme}) => theme.palette.secondary.contrastText};
    background-color: ${({theme}) => theme.palette.secondary.main};
  }
`
