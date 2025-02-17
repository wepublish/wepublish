import {mergeDeepRight} from 'ramda'
import {
  ComponentType,
  createContext,
  memo,
  PropsWithChildren,
  ReactNode,
  ScriptHTMLAttributes,
  useContext,
  useMemo
} from 'react'
import {PartialDeep} from 'type-fest'
import {
  BuilderArticleAuthorsProps,
  BuilderArticleDateProps,
  BuilderArticleListProps,
  BuilderArticleProps,
  BuilderArticleSEOProps
} from './article.interface'
import {BuilderLoginFormProps, BuilderRegistrationFormProps} from './authentication.interface'
import {
  BuilderAuthorChipProps,
  BuilderAuthorLinksProps,
  BuilderAuthorListItemProps,
  BuilderAuthorListProps,
  BuilderAuthorProps
} from './author.interface'
import {BuilderBannerProps} from './banner.interface'
import {
  BuilderBildwurfAdBlockProps,
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderCommentBlockProps,
  BuilderEmbedBlockProps,
  BuilderEventBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderImageBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderListicleBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderPollBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderYouTubeVideoBlockProps
} from './blocks.interface'
import {
  BuilderCommentEditorProps,
  BuilderCommentListItemProps,
  BuilderCommentListItemShareProps,
  BuilderCommentListProps,
  BuilderCommentProps,
  BuilderCommentRatingsProps
} from './comment.interface'
import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  BuilderEventProps,
  BuilderEventSEOProps
} from './event.interface'
import {BuilderFooterProps} from './footer.interface'
import {BuilderImageProps} from './image.interface'
import {
  BuilderListItemProps,
  BuilderOrderedListProps,
  BuilderUnorderedListProps
} from './lists.interface'
import {
  BuilderInvoiceListItemProps,
  BuilderInvoiceListProps,
  BuilderMemberPlanItemProps,
  BuilderMemberPlanPickerProps,
  BuilderPaymentMethodPickerProps,
  BuilderPeriodicityPickerProps,
  BuilderSubscribeProps,
  BuilderSubscriptionListItemProps,
  BuilderSubscriptionListProps
} from './membership.interface'
import {BuilderNavbarProps} from './navbar.interface'
import {BuilderPageProps, BuilderPageSEOProps} from './page.interface'
import {BuilderPeerProps} from './peer.interface'
import {BuilderRenderElementProps, BuilderRenderLeafProps} from './richText.interface'
import {BuilderHeadingProps, BuilderLinkProps, BuilderParagraphProps} from './typography.interface'
import {
  BuilderAlertProps,
  BuilderButtonProps,
  BuilderIconButtonProps,
  BuilderPaginationProps,
  BuilderRatingProps,
  BuilderTextFieldProps
} from './ui.interface'
import {BuilderImageUploadProps, BuilderPersonalDataFormProps} from './user.interface'
import {BuilderBlockStyleProps} from './block-styles.interface'
import {BuilderNavPaperProps} from './nav-paper.interface'
import {BuilderNavAppBarProps} from './nav-app-bar.interface'

const NoComponent = () => null

export type WebsiteBuilderProps = {
  Head: ComponentType<{children: ReactNode}>
  Script: ComponentType<{children?: ReactNode} & ScriptHTMLAttributes<HTMLScriptElement>>
  Navbar: ComponentType<BuilderNavbarProps>
  NavAppBar: ComponentType<BuilderNavAppBarProps>
  NavPaper: ComponentType<BuilderNavPaperProps>
  Footer: ComponentType<BuilderFooterProps>
  Page: ComponentType<BuilderPageProps>
  PageSEO: ComponentType<BuilderPageSEOProps>
  Article: ComponentType<BuilderArticleProps>
  ArticleSEO: ComponentType<BuilderArticleSEOProps>
  ArticleDate: ComponentType<BuilderArticleDateProps>
  ArticleAuthors: ComponentType<BuilderArticleAuthorsProps>
  PeerInformation: ComponentType<BuilderPeerProps>
  Author: ComponentType<BuilderAuthorProps>
  AuthorLinks: ComponentType<BuilderAuthorLinksProps>
  AuthorChip: ComponentType<BuilderAuthorChipProps>
  AuthorListItem: ComponentType<BuilderAuthorListItemProps>
  AuthorList: ComponentType<BuilderAuthorListProps>
  ArticleList: ComponentType<BuilderArticleListProps>
  Banner: ComponentType<BuilderBannerProps>
  Event: ComponentType<BuilderEventProps>
  EventSEO: ComponentType<BuilderEventSEOProps>
  EventList: ComponentType<BuilderEventListProps>
  EventListItem: ComponentType<BuilderEventListItemProps>
  Comment: ComponentType<BuilderCommentProps>
  CommentList: ComponentType<BuilderCommentListProps>
  CommentListItem: ComponentType<BuilderCommentListItemProps>
  CommentListItemShare: ComponentType<BuilderCommentListItemShareProps>
  CommentListItemChild: ComponentType<BuilderCommentListItemProps>
  CommentEditor: ComponentType<BuilderCommentEditorProps>
  CommentRatings: ComponentType<BuilderCommentRatingsProps>
  LoginForm: ComponentType<BuilderLoginFormProps>
  RegistrationForm: ComponentType<BuilderRegistrationFormProps>
  PersonalDataForm: ComponentType<BuilderPersonalDataFormProps>
  SubscriptionList: ComponentType<BuilderSubscriptionListProps>
  SubscriptionListItem: ComponentType<BuilderSubscriptionListItemProps>
  InvoiceList: ComponentType<BuilderInvoiceListProps>
  InvoiceListItem: ComponentType<BuilderInvoiceListItemProps>
  MemberPlanPicker: ComponentType<BuilderMemberPlanPickerProps>
  MemberPlanItem: ComponentType<BuilderMemberPlanItemProps>
  PaymentMethodPicker: ComponentType<BuilderPaymentMethodPickerProps>
  PeriodicityPicker: ComponentType<BuilderPeriodicityPickerProps>
  Subscribe: ComponentType<BuilderSubscribeProps>

  elements: {
    Rating: ComponentType<BuilderRatingProps>
    Alert: ComponentType<BuilderAlertProps>
    TextField: ComponentType<BuilderTextFieldProps>
    Button: ComponentType<BuilderButtonProps>
    IconButton: ComponentType<BuilderIconButtonProps>
    Pagination: ComponentType<BuilderPaginationProps>
    H1: ComponentType<BuilderHeadingProps>
    H2: ComponentType<BuilderHeadingProps>
    H3: ComponentType<BuilderHeadingProps>
    H4: ComponentType<BuilderHeadingProps>
    H5: ComponentType<BuilderHeadingProps>
    H6: ComponentType<BuilderHeadingProps>
    Paragraph: ComponentType<BuilderParagraphProps>
    Link: ComponentType<BuilderLinkProps>
    OrderedList: ComponentType<BuilderOrderedListProps>
    UnorderedList: ComponentType<BuilderUnorderedListProps>
    ListItem: ComponentType<BuilderListItemProps>
    Image: ComponentType<BuilderImageProps>
    ImageUpload: ComponentType<BuilderImageUploadProps>
  }

  richtext: {
    RenderLeaf: ComponentType<BuilderRenderLeafProps>
    RenderElement: ComponentType<BuilderRenderElementProps>
  }

  blocks: {
    Blocks: ComponentType<BuilderBlocksProps>
    Renderer: ComponentType<BuilderBlockRendererProps>
    Title: ComponentType<BuilderTitleBlockProps>
    Image: ComponentType<BuilderImageBlockProps>
    Break: ComponentType<BuilderBreakBlockProps>
    ImageGallery: ComponentType<BuilderImageGalleryBlockProps>
    Quote: ComponentType<BuilderQuoteBlockProps>
    RichText: ComponentType<BuilderRichTextBlockProps>
    HTML: ComponentType<BuilderHTMLBlockProps>
    FacebookPost: ComponentType<BuilderFacebookPostBlockProps>
    FacebookVideo: ComponentType<BuilderFacebookVideoBlockProps>
    InstagramPost: ComponentType<BuilderInstagramPostBlockProps>
    TwitterTweet: ComponentType<BuilderTwitterTweetBlockProps>
    VimeoVideo: ComponentType<BuilderVimeoVideoBlockProps>
    YouTubeVideo: ComponentType<BuilderYouTubeVideoBlockProps>
    SoundCloudTrack: ComponentType<BuilderSoundCloudTrackBlockProps>
    PolisConversation: ComponentType<BuilderPolisConversationBlockProps>
    TikTokVideo: ComponentType<BuilderTikTokVideoBlockProps>
    BildwurfAd: ComponentType<BuilderBildwurfAdBlockProps>
    Embed: ComponentType<BuilderEmbedBlockProps>
    Event: ComponentType<BuilderEventBlockProps>
    Poll: ComponentType<BuilderPollBlockProps>
    Listicle: ComponentType<BuilderListicleBlockProps>
    TeaserGridFlex: ComponentType<BuilderTeaserGridFlexBlockProps>
    TeaserGrid: ComponentType<BuilderTeaserGridBlockProps>
    TeaserList: ComponentType<BuilderTeaserListBlockProps>
    Teaser: ComponentType<BuilderTeaserProps>
    Comment: ComponentType<BuilderCommentBlockProps>
  }

  blockStyles: {
    [key in keyof BuilderBlockStyleProps]: ComponentType<BuilderBlockStyleProps[key]>
  }

  date: {
    format: (date: Date, includeTime?: boolean) => string
  }

  meta: {
    siteTitle: string
    locale: string
  }

  thirdParty: Partial<{
    stripe: string
  }>
}

const WebsiteBuilderContext = createContext<WebsiteBuilderProps>({
  Head: NoComponent,
  Script: NoComponent,
  Navbar: NoComponent,
  NavAppBar: NoComponent,
  NavPaper: NoComponent,
  Footer: NoComponent,
  SubscriptionList: NoComponent,
  SubscriptionListItem: NoComponent,
  InvoiceList: NoComponent,
  InvoiceListItem: NoComponent,
  Subscribe: NoComponent,
  MemberPlanPicker: NoComponent,
  MemberPlanItem: NoComponent,
  PaymentMethodPicker: NoComponent,
  PeriodicityPicker: NoComponent,
  Page: NoComponent,
  PageSEO: NoComponent,
  Article: NoComponent,
  ArticleSEO: NoComponent,
  ArticleDate: NoComponent,
  ArticleAuthors: NoComponent,
  PeerInformation: NoComponent,
  Author: NoComponent,
  AuthorLinks: NoComponent,
  AuthorChip: NoComponent,
  AuthorList: NoComponent,
  AuthorListItem: NoComponent,
  Banner: NoComponent,
  Event: NoComponent,
  EventSEO: NoComponent,
  EventList: NoComponent,
  EventListItem: NoComponent,
  ArticleList: NoComponent,
  CommentList: NoComponent,
  CommentListItem: NoComponent,
  CommentListItemShare: NoComponent,
  CommentListItemChild: NoComponent,
  Comment: NoComponent,
  CommentEditor: NoComponent,
  CommentRatings: NoComponent,
  LoginForm: NoComponent,
  RegistrationForm: NoComponent,
  PersonalDataForm: NoComponent,

  elements: {
    Rating: NoComponent,
    Alert: NoComponent,
    TextField: NoComponent,
    Button: NoComponent,
    IconButton: NoComponent,
    Pagination: NoComponent,
    H1: NoComponent,
    H2: NoComponent,
    H3: NoComponent,
    H4: NoComponent,
    H5: NoComponent,
    H6: NoComponent,
    Paragraph: NoComponent,
    Link: NoComponent,
    OrderedList: NoComponent,
    UnorderedList: NoComponent,
    ListItem: NoComponent,
    Image: NoComponent,
    ImageUpload: NoComponent
  },

  richtext: {
    RenderLeaf: NoComponent,
    RenderElement: NoComponent
  },

  blocks: {
    Blocks: NoComponent,
    Renderer: NoComponent,
    Title: NoComponent,
    Comment: NoComponent,
    Image: NoComponent,
    ImageGallery: NoComponent,
    Quote: NoComponent,
    RichText: NoComponent,
    HTML: NoComponent,
    FacebookPost: NoComponent,
    FacebookVideo: NoComponent,
    InstagramPost: NoComponent,
    TwitterTweet: NoComponent,
    VimeoVideo: NoComponent,
    YouTubeVideo: NoComponent,
    SoundCloudTrack: NoComponent,
    PolisConversation: NoComponent,
    TikTokVideo: NoComponent,
    BildwurfAd: NoComponent,
    Embed: NoComponent,
    Event: NoComponent,
    Poll: NoComponent,
    Listicle: NoComponent,
    TeaserGridFlex: NoComponent,
    TeaserGrid: NoComponent,
    TeaserList: NoComponent,
    Teaser: NoComponent,
    Break: NoComponent
  },

  blockStyles: {
    ImageSlider: NoComponent,
    TeaserSlider: NoComponent,
    FocusTeaser: NoComponent,
    ContextBox: NoComponent,
    Banner: NoComponent
  },

  date: {
    format: date => date.toString()
  },

  meta: {
    siteTitle: 'Newsroom Name',
    locale: 'de-CH'
  },

  thirdParty: {}
})

export const useWebsiteBuilder = () => {
  return useContext(WebsiteBuilderContext)
}

export const WebsiteBuilderProvider = memo<PropsWithChildren<PartialDeep<WebsiteBuilderProps>>>(
  ({children, ...components}) => {
    const parentComponents = useWebsiteBuilder()
    const newComponents = useMemo(
      () => mergeDeepRight(parentComponents, components) as WebsiteBuilderProps,
      [components, parentComponents]
    )

    return (
      <WebsiteBuilderContext.Provider value={newComponents}>
        {children}
      </WebsiteBuilderContext.Provider>
    )
  }
)
