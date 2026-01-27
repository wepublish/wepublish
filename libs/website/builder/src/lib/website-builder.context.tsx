import {
  ComponentType,
  createContext,
  memo,
  PropsWithChildren,
  PropsWithRef,
  ReactNode,
  ScriptHTMLAttributes,
  useContext,
  useMemo,
} from 'react';
import { PartialDeep } from 'type-fest';
import {
  BuilderArticleAuthorsProps,
  BuilderArticleDateProps,
  BuilderArticleListProps,
  BuilderArticleMetaProps,
  BuilderArticleProps,
  BuilderArticleSEOProps,
} from './article.interface';
import {
  BuilderLoginFormProps,
  BuilderRegistrationFormProps,
} from './authentication.interface';
import {
  BuilderAuthorChipProps,
  BuilderAuthorLinksProps,
  BuilderAuthorListItemProps,
  BuilderAuthorListProps,
  BuilderAuthorProps,
} from './author.interface';
import { BuilderBannerProps } from './banner.interface';
import {
  BuilderBildwurfAdBlockProps,
  BuilderBlockRendererProps,
  BuilderBlocksProps,
  BuilderBreakBlockProps,
  BuilderCommentBlockProps,
  BuilderEventBlockProps,
  BuilderFacebookPostBlockProps,
  BuilderFacebookVideoBlockProps,
  BuilderHTMLBlockProps,
  BuilderIFrameBlockProps,
  BuilderImageBlockProps,
  BuilderImageGalleryBlockProps,
  BuilderInstagramPostBlockProps,
  BuilderListicleBlockProps,
  BuilderPolisConversationBlockProps,
  BuilderPollBlockProps,
  BuilderQuoteBlockProps,
  BuilderRichTextBlockProps,
  BuilderSoundCloudTrackBlockProps,
  BuilderSubscribeBlockProps,
  BuilderTeaserGridBlockProps,
  BuilderTeaserGridFlexBlockProps,
  BuilderFlexBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTikTokVideoBlockProps,
  BuilderTitleBlockProps,
  BuilderTwitterTweetBlockProps,
  BuilderVimeoVideoBlockProps,
  BuilderStreamableVideoBlockProps,
  BuilderYouTubeVideoBlockProps,
  BuilderCrowdfundingBlockProps,
  BuilderTeaserSlotsBlockProps,
} from './blocks.interface';
import {
  BuilderCommentEditorProps,
  BuilderCommentListItemProps,
  BuilderCommentListItemShareProps,
  BuilderCommentListProps,
  BuilderCommentProps,
  BuilderCommentRatingsProps,
} from './comment.interface';
import {
  BuilderEventListItemProps,
  BuilderEventListProps,
  BuilderEventProps,
  BuilderEventSEOProps,
} from './event.interface';
import { BuilderFooterProps } from './footer.interface';
import { BuilderImageProps } from './image.interface';
import {
  BuilderListItemProps,
  BuilderOrderedListProps,
  BuilderUnorderedListProps,
} from './lists.interface';
import {
  BuilderInvoiceListItemProps,
  BuilderInvoiceListProps,
  BuilderMemberPlanItemProps,
  BuilderMemberPlanPickerProps,
  BuilderPaymentAmountProps,
  BuilderPaymentMethodPickerProps,
  BuilderPeriodicityPickerProps,
  BuilderSubscribeProps,
  BuilderSubscriptionListItemProps,
  BuilderSubscriptionListProps,
  BuilderTransactionFeeProps,
  BuilderUpgradeProps,
} from './membership.interface';
import { BuilderNavbarProps } from './navbar.interface';
import { BuilderPageProps, BuilderPageSEOProps } from './page.interface';
import { BuilderPeerProps } from './peer.interface';
import {
  BuilderRenderElementProps,
  BuilderRenderLeafProps,
  BuilderRenderRichtextProps,
} from './richText.interface';
import {
  BuilderHeadingProps,
  BuilderLinkProps,
  BuilderParagraphProps,
} from './typography.interface';
import {
  BuilderAlertProps,
  BuilderButtonProps,
  BuilderIconButtonProps,
  BuilderModalProps,
  BuilderPaginationProps,
  BuilderRatingProps,
  BuilderTextFieldProps,
} from './ui.interface';
import {
  BuilderImageUploadProps,
  BuilderPersonalDataFormProps,
} from './user.interface';
import { BuilderBlockStyleProps } from './block-styles.interface';
import { BuilderContentWrapperProps } from './content-wrapper.interface';
import { BuilderTeaserProps } from './teaser.interface';
import { BuilderPaywallProps } from './paywall.interface';
import { BuilderTagProps, BuilderTagSEOProps } from './tag.interface';
import { BuilderTextToIconProps } from './text-to-icon.interface';

const NoComponent: any = () => null;

export type WebsiteBuilderProps = {
  Head: ComponentType<{ children: ReactNode }>;
  Script: ComponentType<
    { children?: ReactNode } & ScriptHTMLAttributes<HTMLScriptElement>
  >;
  Navbar: ComponentType<BuilderNavbarProps>;
  Footer: ComponentType<BuilderFooterProps>;
  Page: ComponentType<BuilderPageProps>;
  PageSEO: ComponentType<BuilderPageSEOProps>;
  Tag: ComponentType<BuilderTagProps>;
  TagSEO: ComponentType<BuilderTagSEOProps>;
  Article: ComponentType<BuilderArticleProps>;
  ArticleSEO: ComponentType<BuilderArticleSEOProps>;
  ArticleMeta: ComponentType<BuilderArticleMetaProps>;
  ArticleDate: ComponentType<BuilderArticleDateProps>;
  PeerInformation: ComponentType<BuilderPeerProps>;
  Author: ComponentType<BuilderAuthorProps>;
  AuthorLinks: ComponentType<BuilderAuthorLinksProps>;
  AuthorChip: ComponentType<BuilderAuthorChipProps>;
  AuthorListItem: ComponentType<BuilderAuthorListItemProps>;
  AuthorList: ComponentType<BuilderAuthorListProps>;
  ArticleAuthor: ComponentType<BuilderAuthorChipProps>;
  ArticleList: ComponentType<BuilderArticleListProps>;
  ArticleAuthors: ComponentType<BuilderArticleAuthorsProps>;
  Banner: ComponentType<BuilderBannerProps>;
  Event: ComponentType<BuilderEventProps>;
  EventSEO: ComponentType<BuilderEventSEOProps>;
  EventList: ComponentType<BuilderEventListProps>;
  EventListItem: ComponentType<BuilderEventListItemProps>;
  Comment: ComponentType<BuilderCommentProps>;
  CommentList: ComponentType<BuilderCommentListProps>;
  CommentListItem: ComponentType<BuilderCommentListItemProps>;
  CommentListItemShare: ComponentType<BuilderCommentListItemShareProps>;
  CommentListItemChild: ComponentType<BuilderCommentListItemProps>;
  CommentEditor: ComponentType<BuilderCommentEditorProps>;
  CommentRatings: ComponentType<BuilderCommentRatingsProps>;
  LoginForm: ComponentType<BuilderLoginFormProps>;
  RegistrationForm: ComponentType<BuilderRegistrationFormProps>;
  PersonalDataForm: ComponentType<BuilderPersonalDataFormProps>;
  SubscriptionList: ComponentType<BuilderSubscriptionListProps>;
  SubscriptionListItem: ComponentType<BuilderSubscriptionListItemProps>;
  InvoiceList: ComponentType<BuilderInvoiceListProps>;
  InvoiceListItem: ComponentType<BuilderInvoiceListItemProps>;
  MemberPlanPicker: ComponentType<BuilderMemberPlanPickerProps>;
  MemberPlanItem: ComponentType<BuilderMemberPlanItemProps>;
  PaymentAmount: ComponentType<BuilderPaymentAmountProps>;
  PaymentMethodPicker: ComponentType<BuilderPaymentMethodPickerProps>;
  PeriodicityPicker: ComponentType<BuilderPeriodicityPickerProps>;
  TransactionFee: ComponentType<BuilderTransactionFeeProps>;
  Subscribe: ComponentType<BuilderSubscribeProps>;
  Upgrade: ComponentType<BuilderUpgradeProps>;
  ContentWrapper: ComponentType<BuilderContentWrapperProps>;
  Paywall: ComponentType<BuilderPaywallProps>;
  TextToIcon: ComponentType<BuilderTextToIconProps>;

  elements: {
    Rating: ComponentType<BuilderRatingProps>;
    Alert: ComponentType<BuilderAlertProps>;
    TextField: ComponentType<BuilderTextFieldProps>;
    Button: ComponentType<BuilderButtonProps>;
    IconButton: ComponentType<BuilderIconButtonProps>;
    Pagination: ComponentType<BuilderPaginationProps>;
    H1: ComponentType<BuilderHeadingProps>;
    H2: ComponentType<BuilderHeadingProps>;
    H3: ComponentType<BuilderHeadingProps>;
    H4: ComponentType<BuilderHeadingProps>;
    H5: ComponentType<BuilderHeadingProps>;
    H6: ComponentType<BuilderHeadingProps>;
    Paragraph: ComponentType<BuilderParagraphProps>;
    Link: ComponentType<BuilderLinkProps>;
    OrderedList: ComponentType<BuilderOrderedListProps>;
    UnorderedList: ComponentType<BuilderUnorderedListProps>;
    ListItem: ComponentType<BuilderListItemProps>;
    Image: ComponentType<PropsWithRef<BuilderImageProps & { ref?: any }>>;
    ImageUpload: ComponentType<BuilderImageUploadProps>;
    Modal: ComponentType<BuilderModalProps>;
  };

  richtext: {
    RenderLeaf: ComponentType<BuilderRenderLeafProps>;
    RenderElement: ComponentType<BuilderRenderElementProps>;
    RenderRichtext: ComponentType<BuilderRenderRichtextProps>;
  };

  blocks: {
    Blocks: ComponentType<BuilderBlocksProps>;
    Renderer: ComponentType<BuilderBlockRendererProps>;
    Title: ComponentType<BuilderTitleBlockProps>;
    Image: ComponentType<BuilderImageBlockProps>;
    Break: ComponentType<BuilderBreakBlockProps>;
    ImageGallery: ComponentType<BuilderImageGalleryBlockProps>;
    Quote: ComponentType<BuilderQuoteBlockProps>;
    RichText: ComponentType<BuilderRichTextBlockProps>;
    HTML: ComponentType<BuilderHTMLBlockProps>;
    Subscribe: ComponentType<BuilderSubscribeBlockProps>;
    FacebookPost: ComponentType<BuilderFacebookPostBlockProps>;
    FacebookVideo: ComponentType<BuilderFacebookVideoBlockProps>;
    InstagramPost: ComponentType<BuilderInstagramPostBlockProps>;
    TwitterTweet: ComponentType<BuilderTwitterTweetBlockProps>;
    VimeoVideo: ComponentType<BuilderVimeoVideoBlockProps>;
    StreamableVideo: ComponentType<BuilderStreamableVideoBlockProps>;
    YouTubeVideo: ComponentType<BuilderYouTubeVideoBlockProps>;
    SoundCloudTrack: ComponentType<BuilderSoundCloudTrackBlockProps>;
    PolisConversation: ComponentType<BuilderPolisConversationBlockProps>;
    TikTokVideo: ComponentType<BuilderTikTokVideoBlockProps>;
    BildwurfAd: ComponentType<BuilderBildwurfAdBlockProps>;
    IFrame: ComponentType<BuilderIFrameBlockProps>;
    Event: ComponentType<BuilderEventBlockProps>;
    Poll: ComponentType<BuilderPollBlockProps>;
    Crowdfunding: ComponentType<BuilderCrowdfundingBlockProps>;
    Listicle: ComponentType<BuilderListicleBlockProps>;
    FlexBlock: ComponentType<BuilderFlexBlockProps>;
    TeaserGridFlex: ComponentType<BuilderTeaserGridFlexBlockProps>;
    TeaserGrid: ComponentType<BuilderTeaserGridBlockProps>;
    TeaserList: ComponentType<BuilderTeaserListBlockProps>;
    BaseTeaser: ComponentType<BuilderTeaserProps>;
    TeaserSlots: ComponentType<BuilderTeaserSlotsBlockProps>;
    Teaser: ComponentType<BuilderTeaserProps>;
    Comment: ComponentType<BuilderCommentBlockProps>;
  };

  blockStyles: {
    [key in keyof BuilderBlockStyleProps]: ComponentType<
      BuilderBlockStyleProps[key]
    >;
  };

  date: {
    format: (date: Date, includeTime?: boolean) => string;
  };

  meta: {
    siteTitle: string;
    locale: string;
  };

  thirdParty: Partial<{
    stripe: string;
  }>;
};

const WebsiteBuilderContext = createContext<WebsiteBuilderProps>({
  Head: NoComponent,
  Script: NoComponent,
  Navbar: NoComponent,
  Footer: NoComponent,
  SubscriptionList: NoComponent,
  SubscriptionListItem: NoComponent,
  InvoiceList: NoComponent,
  InvoiceListItem: NoComponent,
  Subscribe: NoComponent,
  Upgrade: NoComponent,
  TransactionFee: NoComponent,
  MemberPlanPicker: NoComponent,
  MemberPlanItem: NoComponent,
  PaymentAmount: NoComponent,
  PaymentMethodPicker: NoComponent,
  PeriodicityPicker: NoComponent,
  Page: NoComponent,
  PageSEO: NoComponent,
  Tag: NoComponent,
  TagSEO: NoComponent,
  Article: NoComponent,
  ArticleSEO: NoComponent,
  ArticleMeta: NoComponent,
  ArticleDate: NoComponent,
  ArticleAuthors: NoComponent,
  PeerInformation: NoComponent,
  ArticleAuthor: NoComponent,
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
  ContentWrapper: NoComponent,
  Paywall: NoComponent,
  TextToIcon: NoComponent,

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
    ImageUpload: NoComponent,
    Modal: NoComponent,
  },

  richtext: {
    RenderLeaf: NoComponent,
    RenderElement: NoComponent,
    RenderRichtext: NoComponent,
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
    Subscribe: NoComponent,
    FacebookPost: NoComponent,
    FacebookVideo: NoComponent,
    InstagramPost: NoComponent,
    TwitterTweet: NoComponent,
    VimeoVideo: NoComponent,
    StreamableVideo: NoComponent,
    YouTubeVideo: NoComponent,
    SoundCloudTrack: NoComponent,
    PolisConversation: NoComponent,
    TikTokVideo: NoComponent,
    BildwurfAd: NoComponent,
    IFrame: NoComponent,
    Event: NoComponent,
    Poll: NoComponent,
    Crowdfunding: NoComponent,
    Listicle: NoComponent,
    TeaserGridFlex: NoComponent,
    TeaserGrid: NoComponent,
    TeaserList: NoComponent,
    BaseTeaser: NoComponent,
    TeaserSlots: NoComponent,
    Teaser: NoComponent,
    Break: NoComponent,
    FlexBlock: NoComponent,
  },

  blockStyles: {
    ImageSlider: NoComponent,
    TeaserSlider: NoComponent,
    AlternatingTeaser: NoComponent,
    AlternatingTeaserGrid: NoComponent,
    AlternatingTeaserList: NoComponent,
    AlternatingTeaserSlots: NoComponent,
    FocusTeaser: NoComponent,
    ContextBox: NoComponent,
    Banner: NoComponent,
  },

  date: {
    format: date => date.toString(),
  },

  meta: {
    siteTitle: 'Newsroom Name',
    locale: 'de-CH',
  },

  thirdParty: {},
});

export const useWebsiteBuilder = () => useContext(WebsiteBuilderContext);

export const WebsiteBuilderProvider = memo<
  PropsWithChildren<PartialDeep<WebsiteBuilderProps>>
>(({ children, ...components }) => {
  const parentComponents = useWebsiteBuilder();
  const newComponents = useMemo(
    () =>
      ({
        ...parentComponents,
        ...components,
        blocks: {
          ...parentComponents.blocks,
          ...components.blocks,
        },
        blockStyles: {
          ...parentComponents.blockStyles,
          ...components.blockStyles,
        },
        thirdParty: {
          ...parentComponents.thirdParty,
          ...components.thirdParty,
        },
        elements: {
          ...parentComponents.elements,
          ...components.elements,
        },
        richtext: {
          ...parentComponents.richtext,
          ...components.richtext,
        },
        date: {
          ...parentComponents.date,
          ...components.date,
        },
        meta: {
          ...parentComponents.meta,
          ...components.meta,
        },
      }) as WebsiteBuilderProps,
    [components, parentComponents]
  );

  return (
    <WebsiteBuilderContext.Provider value={newComponents}>
      {children}
    </WebsiteBuilderContext.Provider>
  );
});
