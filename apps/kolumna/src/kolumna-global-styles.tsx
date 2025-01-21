import {css, GlobalStyles, Theme} from '@mui/material'

const globalCSS = (theme: Theme) => css`
  button,
  figcaption {
    font-family: ${theme.typography.h1.fontFamily};
  }
`

export const KolumnaGlobalStyles = () => <GlobalStyles styles={globalCSS} />
