import {css, GlobalStyles, TextField, Theme, ThemeProvider} from '@mui/material'
import {
  Article,
  ArticleAuthors,
  ArticleDate,
  ArticleList,
  ArticleSEO,
  ArticleTags
} from '@wepublish/article/website'
import {LoginForm, RegistrationForm} from '@wepublish/authentication/website'
import {
  Author,
  AuthorChip,
  AuthorLinks,
  AuthorList,
  AuthorListItem
} from '@wepublish/author/website'
import {
  Banner,
  BildwurfAdBlock,
  BlockRenderer,
  Blocks,
  BreakBlock,
  CommentBlock,
  ContextBox,
  EmbedBlock,
  EventBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  FocusTeaser,
  HtmlBlock,
  SubscribeBlock,
  ImageBlock,
  ImageGalleryBlock,
  ImageSlider,
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
  TeaserListBlock,
  TeaserSlider,
  TikTokVideoBlock,
  TitleBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock
} from '@wepublish/block-content/website'
import {
  Comment,
  CommentEditor,
  CommentList,
  CommentListItem,
  CommentListItemChild,
  CommentListItemShare,
  CommentRatings
} from '@wepublish/comments/website'
import {Event, EventList, EventListItem, EventSEO} from '@wepublish/event/website'
import {Banner as PageBanner} from '@wepublish/banner/website'
import {Image} from '@wepublish/image/website'
import {
  InvoiceList,
  InvoiceListItem,
  MemberPlanItem,
  MemberPlanPicker,
  PaymentAmountSlider,
  PaymentMethodPicker,
  PeriodicityPicker,
  Subscribe,
  SubscriptionList,
  SubscriptionListItem,
  TransactionFee
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
  Pagination,
  Paragraph,
  Rating,
  theme,
  UnorderedList
} from '@wepublish/ui'
import {ImageUpload, PersonalDataForm} from '@wepublish/user/website'
import {WebsiteBuilderProvider} from '@wepublish/website/builder'
import {format, getDefaultOptions} from 'date-fns'
import {memo, PropsWithChildren} from 'react'
import {IconContext} from 'react-icons'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns'
import {LocalizationProvider} from '@mui/x-date-pickers'

export type WebsiteProps = PropsWithChildren

const dateFormatter = (date: Date, includeTime = true) =>
  includeTime ? format(date, 'dd.MM.yyyy HH:mm') : format(date, 'dd.MM.yyyy')

const styles = (theme: Theme) => css`
  html {
    scroll-padding-top: ${theme.spacing(7)};
    font-family: ${theme.typography.fontFamily};
    hyphens: auto;
    word-break: break-word;

    ${theme.breakpoints.up('lg')} {
      scroll-padding-top: ${theme.spacing(12.5)};
    }
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
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={(getDefaultOptions() as {locale: Locale}).locale}>
        <WebsiteBuilderProvider
          Author={Author}
          AuthorLinks={AuthorLinks}
          AuthorChip={AuthorChip}
          AuthorList={AuthorList}
          AuthorListItem={AuthorListItem}
          ArticleList={ArticleList}
          Article={Article}
          ArticleDate={ArticleDate}
          ArticleAuthors={ArticleAuthors}
          ArticleMeta={ArticleTags}
          ArticleSEO={ArticleSEO}
          Banner={PageBanner}
          PeerInformation={PeerInformation}
          Navbar={Navbar}
          Footer={Footer}
          Event={Event}
          EventSEO={EventSEO}
          EventList={EventList}
          EventListItem={EventListItem}
          CommentList={CommentList}
          CommentListItem={CommentListItem}
          CommentListItemShare={CommentListItemShare}
          CommentListItemChild={CommentListItemChild}
          Comment={Comment}
          CommentEditor={CommentEditor}
          CommentRatings={CommentRatings}
          Page={Page}
          PageSEO={PageSEO}
          LoginForm={LoginForm}
          RegistrationForm={RegistrationForm}
          PersonalDataForm={PersonalDataForm}
          SubscriptionList={SubscriptionList}
          SubscriptionListItem={SubscriptionListItem}
          InvoiceList={InvoiceList}
          InvoiceListItem={InvoiceListItem}
          MemberPlanPicker={MemberPlanPicker}
          MemberPlanItem={MemberPlanItem}
          PeriodicityPicker={PeriodicityPicker}
          PaymentAmount={PaymentAmountSlider}
          PaymentMethodPicker={PaymentMethodPicker}
          TransactionFee={TransactionFee}
          Subscribe={Subscribe}
          elements={{
            TextField,
            Rating,
            Alert,
            Button,
            IconButton,
            Pagination,
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
            Blocks,
            Renderer: BlockRenderer,
            Title: TitleBlock,
            Break: BreakBlock,
            Image: ImageBlock,
            ImageGallery: ImageGalleryBlock,
            Comment: CommentBlock,
            Quote: QuoteBlock,
            HTML: HtmlBlock,
            Subscribe: SubscribeBlock,
            Poll: PollBlock,
            RichText: RichTextBlock,
            Event: EventBlock,
            Listicle: ListicleBlock,
            TeaserGridFlex: TeaserGridFlexBlock,
            TeaserGrid: TeaserGridBlock,
            TeaserList: TeaserListBlock,
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
          blockStyles={{
            Banner,
            ContextBox,
            FocusTeaser,
            ImageSlider,
            TeaserSlider
          }}
          richtext={{RenderElement, RenderLeaf}}
          date={{
            format: dateFormatter
          }}>
          <GlobalStyles styles={styles} />
          {children}
        </WebsiteBuilderProvider>
      </LocalizationProvider>
    </IconContext.Provider>
  </ThemeProvider>
))
