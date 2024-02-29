import {styled} from '@mui/material'

export const Container = styled('main')`
  padding-left: ${({theme}) => theme.spacing(2)};
  padding-right: ${({theme}) => theme.spacing(2)};

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`
