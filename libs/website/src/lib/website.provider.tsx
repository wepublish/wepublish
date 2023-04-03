import {css, Global} from '@emotion/react'
import {ThemeProvider} from '@mui/material'
import {Article} from '@wepublish/article/website'
import {
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock
} from '@wepublish/block-content/website'
import {MemberPlans, PayInvoices, Subscribe} from '@wepublish/membership/website'
import {Footer, Navbar} from '@wepublish/navigation/website'
import {Page} from '@wepublish/page/website'
import {RenderElement, RenderLeaf} from '@wepublish/richtext/website'
import {
  Button,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Link,
  ListItem,
  OrderedList,
  Paragraph,
  theme,
  UnorderedList
} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {memo, PropsWithChildren} from 'react'
import {IconContext} from 'react-icons'

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
