import {styled} from '@mui/material'
import {FocusedTeaserContent, FocusedTeaserTitle, FocusTeaser} from '@wepublish/website'

export const ZwoelfFocusTeaser = styled(FocusTeaser)`
  ${FocusedTeaserContent} {
    color: ${({theme}) => theme.palette.secondary.contrastText};
    background-color: ${({theme}) => theme.palette.secondary.main};
  }
  ${FocusedTeaserTitle} {
    background-color: ${({theme}) => theme.palette.primary.main};
  }
`
