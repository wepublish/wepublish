import {Theme as MuiTheme} from '@mui/material'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  const content: any
  export const ReactComponent: any
  export default content
}

declare module '@emotion/styled' {
  export interface Theme extends MuiTheme {}
}
