import {mergeDeepRight} from 'ramda'
import {
  ComponentType,
  createContext,
  memo,
  PropsWithChildren,
  ReactNode,
  ScriptHTMLAttributes,
  useContext
} from 'react'
import {PartialDeep} from 'type-fest'
import {
  BuilderArticleListItemProps,
  BuilderArticleListProps,
  BuilderArticleProps,
  BuilderArticleSEOProps
} from './article.interface'
import {BuilderLoginFormProps, BuilderRegistrationFormProps} from './authentication.interface'
import {
  BuilderAuthorChipProps,
  BuilderAuthorListItemProps,
  BuilderAuthorListProps,
  BuilderAuthorProps
} from './author.interface'
import {
  BuilderBildwurfAdBlockProps,
  BuilderBlockRendererProps,
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
  BuilderCommentListProps,
  BuilderCommentListSingleCommentProps
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
  BuilderTextFieldProps
} from './ui.interface'
import {BuilderPersonalDataFormProps, BuilderImageUploadProps} from './user.interface'

const NoComponent = () => null

export type WebsiteBuilderProps = {
  Head: ComponentType<{children: ReactNode}>
  Script: ComponentType<{children?: ReactNode} & ScriptHTMLAttributes<HTMLScriptElement>>
  Navbar: ComponentType<BuilderNavbarProps>
  Footer: ComponentType<BuilderFooterProps>
  Page: ComponentType<BuilderPageProps>
  PageSEO: ComponentType<BuilderPageSEOProps>
  Article: ComponentType<BuilderArticleProps>
  ArticleSEO: ComponentType<BuilderArticleSEOProps>
  PeerInformation: ComponentType<BuilderPeerProps>
  Author: ComponentType<BuilderAuthorProps>
  AuthorChip: ComponentType<BuilderAuthorChipProps>
  AuthorListItem: ComponentType<BuilderAuthorListItemProps>
  AuthorList: ComponentType<BuilderAuthorListProps>
  ArticleListItem: ComponentType<BuilderArticleListItemProps>
  ArticleList: ComponentType<BuilderArticleListProps>
  Event: ComponentType<BuilderEventProps>
  EventSEO: ComponentType<BuilderEventSEOProps>
  EventList: ComponentType<BuilderEventListProps>
  EventListItem: ComponentType<BuilderEventListItemProps>
  CommentList: ComponentType<BuilderCommentListProps>
  CommentListItem: ComponentType<BuilderCommentListItemProps>
  CommentListSingleComment: ComponentType<BuilderCommentListSingleCommentProps>
  CommentEditor: ComponentType<BuilderCommentEditorProps>
  LoginForm: ComponentType<BuilderLoginFormProps>
  RegistrationForm: ComponentType<BuilderRegistrationFormProps>
  PersonalDataForm: ComponentType<BuilderPersonalDataFormProps>
  SubscriptionList: ComponentType<BuilderSubscriptionListProps>
  SubscriptionListItem: ComponentType<BuilderSubscriptionListItemProps>
  InvoiceList: ComponentType<BuilderInvoiceListProps>
  InvoiceListItem: ComponentType<BuilderInvoiceListItemProps>

  elements: {
    Alert: ComponentType<BuilderAlertProps>
    TextField: ComponentType<BuilderTextFieldProps>
    Button: ComponentType<BuilderButtonProps>
    IconButton: ComponentType<BuilderIconButtonProps>
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
    Teaser: ComponentType<BuilderTeaserProps>
    Comment: ComponentType<BuilderCommentBlockProps>
  }

  date: {
    format: (date: Date, includeTime?: boolean) => string
  }

  locale: string
}

const WebsiteBuilderContext = createContext<WebsiteBuilderProps>({
  Head: NoComponent,
  Script: NoComponent,
  Navbar: NoComponent,
  Footer: NoComponent,
  SubscriptionList: NoComponent,
  SubscriptionListItem: NoComponent,
  InvoiceList: NoComponent,
  InvoiceListItem: NoComponent,
  Page: NoComponent,
  PageSEO: NoComponent,
  Article: NoComponent,
  ArticleSEO: NoComponent,
  PeerInformation: NoComponent,
  Author: NoComponent,
  AuthorChip: NoComponent,
  AuthorList: NoComponent,
  AuthorListItem: NoComponent,
  Event: NoComponent,
  EventSEO: NoComponent,
  EventList: NoComponent,
  EventListItem: NoComponent,
  ArticleList: NoComponent,
  ArticleListItem: NoComponent,
  CommentList: NoComponent,
  CommentListItem: NoComponent,
  CommentListSingleComment: NoComponent,
  CommentEditor: NoComponent,
  LoginForm: NoComponent,
  RegistrationForm: NoComponent,
  PersonalDataForm: NoComponent,

  elements: {
    Alert: NoComponent,
    TextField: NoComponent,
    Button: NoComponent,
    IconButton: NoComponent,
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
    Teaser: NoComponent,
    Break: NoComponent
  },

  date: {
    format: date => date.toString()
  },

  locale: 'ch-DE'
})

export const useWebsiteBuilder = () => {
  return useContext(WebsiteBuilderContext)
}

export const WebsiteBuilderProvider = memo<PropsWithChildren<PartialDeep<WebsiteBuilderProps>>>(
  ({children, ...components}) => {
    const parentComponents = useWebsiteBuilder()
    const newComponents = mergeDeepRight(parentComponents, components) as WebsiteBuilderProps

    return (
      <WebsiteBuilderContext.Provider value={newComponents}>
        {children}
      </WebsiteBuilderContext.Provider>
    )
  }
)
