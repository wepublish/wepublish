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
import {MemberPlans, PayInvoices, Subscribe} from '@wepublish/membership/website'
import {memo, PropsWithChildren} from 'react'
import {Navbar, Footer} from '@wepublish/navigation/website'
import {IconContext} from 'react-icons'
import {Article} from '@wepublish/article/website'
import {Page} from '@wepublish/page/website'
import {css, Global} from '@emotion/react'
import {RenderElement, RenderLeaf} from '@wepublish/richtext/website'
import {
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TitleBlock,
  TeaserGridFlexBlock
} from '@wepublish/block-content/website'

const globalStyles = css`
  body {
    word-break: break-word;
  }

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
        PayInvoices={PayInvoices}
        Page={Page}
        Article={Article}
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
        blocks={{
          Title: TitleBlock,
          Image: ImageBlock,
          Quote: QuoteBlock,
          HTML: HtmlBlock,
          RichText: RichTextBlock,
          TeaserGridFlex: TeaserGridFlexBlock
        }}
        richtext={{RenderElement, RenderLeaf}}>
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
