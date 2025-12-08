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
} from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderBlockRendererProps = {
  block: BlockContent;
  index: number;
  count: number;
  type: 'Page' | 'Article';
};

export type BuilderBlocksProps = {
  blocks: BlockContent[];
  type: BuilderBlockRendererProps['type'];
};

export type BuilderTitleBlockProps = Omit<TitleBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderBreakBlockProps = Omit<BreakBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderImageBlockProps = Omit<ImageBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderImageGalleryBlockProps = Omit<ImageGalleryBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderQuoteBlockProps = Omit<QuoteBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderEventBlockProps = Omit<EventBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderRichTextBlockProps = Omit<RichTextBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderHTMLBlockProps = Omit<HtmlBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderFacebookPostBlockProps = Omit<FacebookPostBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderFacebookVideoBlockProps = Omit<
  FacebookVideoBlock,
  'type'
> & { className?: string; style?: CSSProperties };
export type BuilderInstagramPostBlockProps = Omit<
  InstagramPostBlock,
  'type'
> & { className?: string; style?: CSSProperties };
export type BuilderTwitterTweetBlockProps = Omit<TwitterTweetBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderVimeoVideoBlockProps = Omit<VimeoVideoBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderStreamableVideoBlockProps = Omit<
  StreamableVideoBlock,
  'type'
> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderYouTubeVideoBlockProps = Omit<YouTubeVideoBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderSoundCloudTrackBlockProps = Omit<
  SoundCloudTrackBlock,
  'type'
> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderPolisConversationBlockProps = Omit<
  PolisConversationBlock,
  'type'
> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderTikTokVideoBlockProps = Omit<TikTokVideoBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderBildwurfAdBlockProps = Omit<BildwurfAdBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderIFrameBlockProps = Omit<IFrameBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderPollBlockProps = Omit<PollBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderCrowdfundingBlockProps = Omit<CrowdfundingBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderListicleBlockProps = Omit<ListicleBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderCommentBlockProps = Omit<CommentBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderSubscribeBlockProps = Omit<SubscribeBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string;
  style?: CSSProperties;
};
export type BuilderTeaserGridBlockProps = Omit<TeaserGridBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};

export type BuilderTeaserListBlockProps = Omit<TeaserListBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};

export type BuilderTeaserSlotsBlockProps = Omit<TeaserSlotsBlock, 'type'> & {
  className?: string;
  style?: CSSProperties;
};
