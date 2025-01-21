import {css, GlobalStyles, Theme} from '@mui/material'
import styled from '@emotion/styled'

const globalCSS = (theme: Theme) => css`
  button,
  figcaption {
    font-family: ${theme.typography.h1.fontFamily};
  }
`

export const KolumnaGlobalStyles = () => <GlobalStyles styles={globalCSS} />
