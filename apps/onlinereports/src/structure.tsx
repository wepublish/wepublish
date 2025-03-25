import theme from './theme'
import styled from '@emotion/styled'

export const Structure = styled('div')`
  display: grid;
  align-items: flex-start;
  grid-template-columns: 1fr 994px minmax(auto, 320px) 1fr;

  row-gap: ${({theme}) => theme.spacing(2.5)};

  ${theme.breakpoints.up('md')} {
    //column-gap: ${theme.spacing(2.5)};
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr minmax(auto, 994px) 1fr;
  }
`
