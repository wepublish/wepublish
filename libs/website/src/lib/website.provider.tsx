import {ThemeProvider, CssBaseline} from '@mui/material'
import {theme, Button} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website-builder'
import {memo, PropsWithChildren} from 'react'
import {Navigation} from '@wepublish/navigation/website'
import Head from 'next/head'

export type WebsiteProps = PropsWithChildren

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />

    <WebsiteBuilderProvider Navigation={Navigation} Head={Head} Button={Button}>
      {children}
    </WebsiteBuilderProvider>
  </ThemeProvider>
))
