import {css, GlobalStyles} from '@mui/material'

const globalCSS = css`
  html {
    hyphenate-limit-chars: auto 10 10;
    -webkit-hyphenate-limit-before: 10;
    -webkit-hyphenate-limit-after: 10;
  }
`

export const OnlineReportsGlobalStyles = () => <GlobalStyles styles={globalCSS} />
