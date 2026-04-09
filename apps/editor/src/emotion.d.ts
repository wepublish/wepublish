/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Theme as MuiTheme } from '@mui/material/styles';

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Theme extends MuiTheme {}
}
