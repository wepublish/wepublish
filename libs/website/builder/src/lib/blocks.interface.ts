import {
  BildwurfAdBlock,
  BlockContent,
  BreakBlock,
  CommentBlock,
  CrowdfundingBlock,
  EventBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  HtmlBlock,
  IFrameBlock,
  ImageBlock,
  ImageGalleryBlock,
  InstagramPostBlock,
  ListicleBlock,
  PolisConversationBlock,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  SoundCloudTrackBlock,
  SubscribeBlock,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TeaserListBlock,
  TeaserSlotsBlock,
  TikTokVideoBlock,
  TitleBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  StreamableVideoBlock,
  YouTubeVideoBlock,
  FlexBlock,
} from '@wepublish/website/api';

export type BlockSibling = {
  typeName: string;
  blockStyle?: string;
};

export type BuilderBlockRendererProps = {
  className?: string;
  siblings?: Array<BlockSibling>;
  block: BlockContent;
  index: number;
  count: number;
  type: 'Page' | 'Article' | 'PageNested' | 'ArticleNested';
};

export type BuilderBlocksProps = {
  blocks: BlockContent[];
  type: BuilderBlockRendererProps['type'];
};

export type BlockProps = {
  className?: string;
  siblings?: Array<BlockSibling>;
};

type WithBlockProps<T extends { type?: unknown }> = Omit<T, 'type'> &
  BlockProps;

export type BuilderFlexBlockProps = WithBlockProps<FlexBlock>;
export type BuilderTitleBlockProps = WithBlockProps<TitleBlock>;
export type BuilderBreakBlockProps = WithBlockProps<BreakBlock>;
export type BuilderImageBlockProps = WithBlockProps<ImageBlock>;
export type BuilderImageGalleryBlockProps = WithBlockProps<ImageGalleryBlock>;
export type BuilderQuoteBlockProps = WithBlockProps<QuoteBlock>;
export type BuilderEventBlockProps = WithBlockProps<EventBlock>;
export type BuilderRichTextBlockProps = WithBlockProps<RichTextBlock>;
export type BuilderHTMLBlockProps = WithBlockProps<HtmlBlock>;
export type BuilderFacebookPostBlockProps = WithBlockProps<FacebookPostBlock>;
export type BuilderFacebookVideoBlockProps = WithBlockProps<FacebookVideoBlock>;
export type BuilderInstagramPostBlockProps = WithBlockProps<InstagramPostBlock>;
export type BuilderTwitterTweetBlockProps = WithBlockProps<TwitterTweetBlock>;
export type BuilderVimeoVideoBlockProps = WithBlockProps<VimeoVideoBlock>;
export type BuilderStreamableVideoBlockProps =
  WithBlockProps<StreamableVideoBlock>;
export type BuilderYouTubeVideoBlockProps = WithBlockProps<YouTubeVideoBlock>;
export type BuilderSoundCloudTrackBlockProps =
  WithBlockProps<SoundCloudTrackBlock>;
export type BuilderPolisConversationBlockProps =
  WithBlockProps<PolisConversationBlock>;
export type BuilderTikTokVideoBlockProps = WithBlockProps<TikTokVideoBlock>;
export type BuilderBildwurfAdBlockProps = WithBlockProps<BildwurfAdBlock>;
export type BuilderIFrameBlockProps = WithBlockProps<IFrameBlock>;
export type BuilderPollBlockProps = WithBlockProps<PollBlock>;
export type BuilderCrowdfundingBlockProps = WithBlockProps<CrowdfundingBlock>;
export type BuilderListicleBlockProps = WithBlockProps<ListicleBlock>;
export type BuilderCommentBlockProps = WithBlockProps<CommentBlock>;
export type BuilderSubscribeBlockProps = WithBlockProps<SubscribeBlock>;
export type BuilderTeaserGridFlexBlockProps =
  WithBlockProps<TeaserGridFlexBlock>;
export type BuilderTeaserGridBlockProps = WithBlockProps<TeaserGridBlock>;
export type BuilderTeaserListBlockProps = WithBlockProps<TeaserListBlock>;
export type BuilderTeaserSlotsBlockProps = WithBlockProps<TeaserSlotsBlock>;
