import {styled} from '@mui/material'

export const FullWidthContainer = styled('main')<{backgroundColor?: string}>`
  background-color: ${({theme, backgroundColor}) => backgroundColor || theme.palette.info.main};
  grid-column: 1 / -1;

  ${({theme}) => theme.breakpoints.up('md')} {
    padding: 0;
  }
`
