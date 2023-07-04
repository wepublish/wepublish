import {GlobalStyles, Theme, ThemeProvider, css, TextField} from '@mui/material'
import {Article} from '@wepublish/article/website'
import {LoginForm, RegistrationForm} from '@wepublish/authentication/website'
import {Author, AuthorChip} from '@wepublish/author/website'
import {
  BlockRenderer,
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  Teaser,
  TeaserGridBlock,
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
  IconButton,
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
        Author={Author}
        AuthorChip={AuthorChip}
        Article={Article}
        Navbar={Navbar}
        Footer={Footer}
        Event={Event}
        EventSEO={EventSEO}
        EventList={EventList}
        EventListItem={EventListItem}
        Page={Page}
        LoginForm={LoginForm}
        RegistrationForm={RegistrationForm}
        elements={{
          TextField,
          Alert,
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
          Renderer: BlockRenderer,
          Title: TitleBlock,
          Image: ImageBlock,
          Quote: QuoteBlock,
          HTML: HtmlBlock,
          RichText: RichTextBlock,
          TeaserGridFlex: TeaserGridFlexBlock,
          TeaserGrid: TeaserGridBlock,
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
