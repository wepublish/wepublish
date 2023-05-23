import {ThemeProvider, CssBaseline} from '@mui/material'
import {theme, Button} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {memo, PropsWithChildren} from 'react'
import {Navbar, Footer} from '@wepublish/navigation/website'
import Head from 'next/head'

export type WebsiteProps = PropsWithChildren

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />

    <WebsiteBuilderProvider Navbar={Navbar} Footer={Footer} Head={Head} Button={Button}>
      {children}
    </WebsiteBuilderProvider>
  </ThemeProvider>
))
