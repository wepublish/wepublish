import {styled} from '@mui/material'
import {BreakBlock} from '@wepublish/website'

export const BajourBreakBlock = styled(BreakBlock)`
  background-color: ${({theme}) => theme.palette.accent.main};
  color: white;

  ${({theme}) => theme.breakpoints.up('sm')} {
    padding-left: 0;
    padding-right: 0;
  }

  ${({theme}) => theme.breakpoints.up('md')} {
    padding-left: ${({theme}) => theme.spacing(10)};
    padding-right: ${({theme}) => theme.spacing(10)};
  }
`
