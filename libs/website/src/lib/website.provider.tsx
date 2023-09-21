import {GlobalStyles, TextField, Theme, ThemeProvider, css} from '@mui/material'
import {Article, ArticleList, ArticleListItem, ArticleSEO} from '@wepublish/article/website'
import {LoginForm, RegistrationForm} from '@wepublish/authentication/website'
import {Author, AuthorChip, AuthorList, AuthorListItem} from '@wepublish/author/website'
import {
  BildwurfAdBlock,
  BlockRenderer,
  BreakBlock,
  EmbedBlock,
  EventBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  HtmlBlock,
  ImageBlock,
  ImageGalleryBlock,
  InstagramPostBlock,
  ListicleBlock,
  PolisConversationBlock,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  SoundCloudTrackBlock,
  Teaser,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TikTokVideoBlock,
  TitleBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock,
  CommentBlock
} from '@wepublish/block-content/website'
import {
  CommentEditor,
  CommentList,
  CommentListItem,
  CommentListSingleComment
} from '@wepublish/comments/website'
import {Event, EventList, EventListItem, EventSEO} from '@wepublish/event/website'
import {PersonalDataForm, ImageUpload} from '@wepublish/user/website'
import {Image} from '@wepublish/image/website'
import {
  SubscriptionList,
  SubscriptionListItem,
  InvoiceListItem,
  InvoiceList
} from '@wepublish/membership/website'
import {Footer, Navbar} from '@wepublish/navigation/website'
import {Page, PageSEO} from '@wepublish/page/website'
import {PeerInformation} from '@wepublish/peering/website'
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

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ? format(date, 'dd.MM.yyyy HH:mm') : format(date, 'dd.MM.yyyy')

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

  img,
  iframe {
    // fixes taking up more space than needed in 'display: block' wrappers
    vertical-align: bottom;
  }
`

export const WebsiteProvider = memo<WebsiteProps>(({children}) => (
  <ThemeProvider theme={theme}>
    <IconContext.Provider value={{}}>
      <WebsiteBuilderProvider
        Author={Author}
        AuthorChip={AuthorChip}
        AuthorList={AuthorList}
        AuthorListItem={AuthorListItem}
        ArticleList={ArticleList}
        ArticleListItem={ArticleListItem}
        Article={Article}
        ArticleSEO={ArticleSEO}
        PeerInformation={PeerInformation}
        Navbar={Navbar}
        Footer={Footer}
        Event={Event}
        EventSEO={EventSEO}
        EventList={EventList}
        EventListItem={EventListItem}
        CommentList={CommentList}
        CommentListItem={CommentListItem}
        CommentListSingleComment={CommentListSingleComment}
        CommentEditor={CommentEditor}
        Page={Page}
        PageSEO={PageSEO}
        LoginForm={LoginForm}
        RegistrationForm={RegistrationForm}
        PersonalDataForm={PersonalDataForm}
        SubscriptionList={SubscriptionList}
        SubscriptionListItem={SubscriptionListItem}
        InvoiceList={InvoiceList}
        InvoiceListItem={InvoiceListItem}
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
          ImageUpload,
          OrderedList,
          ListItem,
          Image
        }}
        blocks={{
          Renderer: BlockRenderer,
          Title: TitleBlock,
          Break: BreakBlock,
          Image: ImageBlock,
          ImageGallery: ImageGalleryBlock,
          Comment: CommentBlock,
          Quote: QuoteBlock,
          HTML: HtmlBlock,
          Poll: PollBlock,
          RichText: RichTextBlock,
          Event: EventBlock,
          Listicle: ListicleBlock,
          TeaserGridFlex: TeaserGridFlexBlock,
          TeaserGrid: TeaserGridBlock,
          Teaser,
          BildwurfAd: BildwurfAdBlock,
          Embed: EmbedBlock,
          FacebookPost: FacebookPostBlock,
          FacebookVideo: FacebookVideoBlock,
          InstagramPost: InstagramPostBlock,
          PolisConversation: PolisConversationBlock,
          SoundCloudTrack: SoundCloudTrackBlock,
          TikTokVideo: TikTokVideoBlock,
          TwitterTweet: TwitterTweetBlock,
          VimeoVideo: VimeoVideoBlock,
          YouTubeVideo: YouTubeVideoBlock
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
