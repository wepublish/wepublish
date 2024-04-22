import {styled} from '@mui/material'
import {BreakBlock} from '@wepublish/website'

export const BajourBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.secondary.cta};
  color: white;

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: ${({theme}) => theme.spacing(10)} !important;
    padding-right: ${({theme}) => theme.spacing(10)} !important;
  }
`
