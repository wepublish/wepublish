import {ThemeProvider} from '@mui/material'
import {
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  Teaser
} from '@wepublish/block-content/website'
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
import {Image} from '@wepublish/image/website'

export type WebsiteProps = PropsWithChildren

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <IconContext.Provider value={{}}>
      <WebsiteBuilderProvider
        Navbar={Navbar}
        Footer={Footer}
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
          ListItem,
          Image
        }}
        blocks={{
          Title: TitleBlock,
          Image: ImageBlock,
          Quote: QuoteBlock,
          HTML: HtmlBlock,
          RichText: RichTextBlock,
          TeaserGridFlex: TeaserGridFlexBlock,
          Teaser
        }}
        richtext={{RenderElement, RenderLeaf}}>
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
