import {Container, css, styled} from '@mui/material'

export const MainSpacer = styled(Container, {
  shouldForwardProp(propName) {
    return !['bg'].includes(propName as string)
  }
})<{bg?: string}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(5)};

  ${({bg}) =>
    bg &&
    css`
      background: ${bg};
    `}

  ${({theme}) => css`
    ${theme.breakpoints.up('md')} {
      gap: ${theme.spacing(10)};
    }
  `}
`
