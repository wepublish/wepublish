import {ThemeProvider, CssBaseline} from '@mui/material'
import {theme, Button} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website-builder'
import {MemberPlans, Subscribe} from '@wepublish/membership/website'
import {memo, PropsWithChildren} from 'react'
import {Navigation} from '@wepublish/navigation/website'
import {IconContext} from 'react-icons'
import Head from 'next/head'

export type WebsiteProps = PropsWithChildren

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />

    <IconContext.Provider value={{}}>
      <WebsiteBuilderProvider
        Navigation={Navigation}
        MemberPlans={MemberPlans}
        Subscribe={Subscribe}
        Head={Head}
        Button={Button}>
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
