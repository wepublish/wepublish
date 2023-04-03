import {CssBaseline, ThemeProvider} from '@mui/material'
import {ComponentType} from 'react'
import {theme} from '../src/lib/theme'

export const withMuiTheme = (Story: ComponentType) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Story />
  </ThemeProvider>
)

export const decorators = [withMuiTheme]
