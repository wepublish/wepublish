import styled from '@emotion/styled'
import {Container} from '@mui/material'

export const MainSpacer = styled(Container)`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};

  ${({theme}) => theme.breakpoints.up('md')} {
    gap: ${({theme}) => theme.spacing(10)};
  }
`
