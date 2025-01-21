import {css, GlobalStyles, Theme} from '@mui/material'
import styled from '@emotion/styled'

const globalCSS = (theme: Theme) => css`
  html {
    hyphenate-limit-chars: auto 10 10;
    -webkit-hyphenate-limit-before: 10;
    -webkit-hyphenate-limit-after: 10;
  }
`

export const MannschaftGlobalStyles = () => <GlobalStyles styles={globalCSS} />
