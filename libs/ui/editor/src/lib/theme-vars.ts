import type { CssVarsTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    vars: CssVarsTheme['vars'];
  }
}

export {};
