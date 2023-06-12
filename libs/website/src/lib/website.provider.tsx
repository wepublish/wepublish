import {ThemeProvider, TextField} from '@mui/material'
import {Article} from '@wepublish/article/website'
import {LoginForm} from '@wepublish/authentication/website'
import {
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  Teaser,
  TeaserGridFlexBlock,
  TitleBlock
} from '@wepublish/block-content/website'
import {Event, EventList, EventListItem, EventSEO} from '@wepublish/event/website'
import {Image} from '@wepublish/image/website'
import {Footer, Navbar} from '@wepublish/navigation/website'
import {Page} from '@wepublish/page/website'
import {RenderElement, RenderLeaf} from '@wepublish/richtext/website'
import {
  Alert,
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
  UnorderedList,
  theme
} from '@wepublish/ui'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {format} from 'date-fns'
import {PropsWithChildren, memo} from 'react'
import {IconContext} from 'react-icons'

export type WebsiteProps = PropsWithChildren

const dateFormatter = (date: Date) => format(date, 'dd.MM.yyyy HH:mm')

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
        LoginForm={LoginForm}
        elements={{
          TextField,
          Alert,
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
        richtext={{RenderElement, RenderLeaf}}
        date={{
          format: dateFormatter
        }}>
        {children}
      </WebsiteBuilderProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
