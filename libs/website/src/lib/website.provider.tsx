import {GlobalStyles, Theme, ThemeProvider, css} from '@mui/material'
import {Article} from '@wepublish/article/website'
import {
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  Teaser
} from '@wepublish/block-content/website'
import {Event, EventList, EventListItem, EventSEO} from '@wepublish/event/website'
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
  UnorderedList,
  IconButton
} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {memo, PropsWithChildren} from 'react'
import {IconContext} from 'react-icons'
import {Image} from '@wepublish/image/website'
import {format} from 'date-fns'

export type WebsiteProps = PropsWithChildren

const dateFormatter = (date: Date) => format(date, 'dd.MM.yyyy HH:mm')

const styles = (theme: Theme) => css`
  html {
    font-family: ${theme.typography.fontFamily};
  }

  * {
    text-wrap: pretty;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    text-wrap: balance;
  }
`

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <IconContext.Provider value={{}}>
      <WebsiteBuilderProvider
        Article={Article}
        Navbar={Navbar}
        Footer={Footer}
        Event={Event}
        EventSEO={EventSEO}
        EventList={EventList}
        EventListItem={EventListItem}
        Page={Page}
        elements={{
          Button,
          IconButton,
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
        richtext={{RenderElement, RenderLeaf}}
        date={{
          format: dateFormatter
        }}>
        <GlobalStyles styles={styles} />
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
