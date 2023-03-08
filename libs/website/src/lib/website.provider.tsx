import {ThemeProvider} from '@mui/material'
import {
  theme,
  Button,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Paragraph,
  Link,
  UnorderedList,
  OrderedList,
  ListItem
} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website-builder'
import {MemberPlans, Subscribe} from '@wepublish/membership/website'
import {memo, PropsWithChildren} from 'react'
import {Navbar, Footer} from '@wepublish/navigation/website'
import {IconContext} from 'react-icons'
import {Page} from '@wepublish/page/website'
import {css, Global} from '@emotion/react'
import {RenderElement, RenderLeaf} from '@wepublish/richtext/website'

const globalStyles = css`
  img {
    max-width: 100%;
    height: auto;
  }
`

export type WebsiteProps = PropsWithChildren

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <Global styles={globalStyles} />

    <IconContext.Provider value={{}}>
      <WebsiteBuilderProvider
        Navbar={Navbar}
        Footer={Footer}
        MemberPlans={MemberPlans}
        Subscribe={Subscribe}
        Page={Page}
        elements={{
          Button,
          H1,
          H2,
          H3,
          H4,
          H5,
          H6,
          Paragraph,
          Link,
          UnorderedList,
          OrderedList,
          ListItem
        }}
        richtext={{RenderElement, RenderLeaf}}>
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
