import {styled} from '@mui/material'
import {FocusedTeaserContent, FocusedTeaserTitle, FocusTeaser} from '@wepublish/website'

export const ZwoelfFocusTeaser = styled(FocusTeaser)`
  ${FocusedTeaserContent} {
    color: ${({theme}) => theme.palette.secondary.contrastText};
    background-color: ${({theme}) => theme.palette.secondary.main};
  }
  ${FocusedTeaserTitle} {
    background-color: ${({theme}) => theme.palette.primary.main};

    ${({theme}) => theme.breakpoints.down('sm')} {
      padding: ${({theme}) => theme.spacing(6)};
    }
  }
`
