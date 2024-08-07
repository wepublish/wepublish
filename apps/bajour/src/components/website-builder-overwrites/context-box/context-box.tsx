import {styled} from '@mui/material'
import {ContextBox, ContextBoxAllAbout, ContextBoxIcon, ContextBoxLine} from '@wepublish/website'

export const BajourContextBox = styled(ContextBox)`
  ${({theme}) => theme.breakpoints.up('sm')} {
    margin-left: 10%;
    max-width: ${({theme}) => theme.spacing(38)};
    padding: 0;
  }

  ${ContextBoxAllAbout},
  ${ContextBoxLine},
  ${ContextBoxIcon} {
    color: ${({theme}) => theme.palette.secondary.dark};
  }

  .MuiButtonBase-root {
    background-color: ${({theme}) => theme.palette.secondary.dark};
  }
`
