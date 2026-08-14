import {
  FullImageGalleryBlockFragment,
  FullBreakBlockFragment,
  FullTitleBlockFragment,
  FullFlexBlockFragment,
  FullBildwurfAdBlockFragment,
  FullCrowdfundingBlockFragment,
  FullEventBlockFragment,
  FullFacebookPostBlockFragment,
  FullFacebookVideoBlockFragment,
  FullHtmlBlockFragment,
  FullIFrameBlockFragment,
  FullInstagramPostBlockFragment,
  FullListicleBlockFragment,
  FullPolisConversationBlockFragment,
  FullPollBlockFragment,
  FullQuoteBlockFragment,
  FullRichTextBlockFragment,
  FullSoundCloudTrackBlockFragment,
  FullStreamableVideoBlockFragment,
  FullSubscribeBlockFragment,
  FullTeaserGridFlexBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
  FullTikTokVideoBlockFragment,
  FullTwitterTweetBlockFragment,
  FullVimeoVideoBlockFragment,
  FullYouTubeVideoBlockFragment,
  FullCommentBlockFragment,
  FullImageBlockFragment,
  FullTeaserGridBlockFragment,
  FullBlockFragment,
} from '@wepublish/website/api';

export type BuilderBlockRendererProps = {
  className?: string;
  block: FullBlockFragment;
  index: number;
  count: number;
  type: 'Page' | 'Article';
  level?: number;
};

export type BuilderBlocksProps = {
  blocks: FullBlockFragment[];
  type: BuilderBlockRendererProps['type'];
};

export type BlockProps = {
  className?: string;
};

type WithBlockProps<T> = Omit<T, 'type'> & BlockProps;

export type BuilderFlexBlockProps = WithBlockProps<FullFlexBlockFragment>;
export type BuilderTitleBlockProps = WithBlockProps<FullTitleBlockFragment>;
export type BuilderBreakBlockProps = WithBlockProps<FullBreakBlockFragment>;
export type BuilderImageBlockProps = WithBlockProps<FullImageBlockFragment>;
export type BuilderImageGalleryBlockProps =
  WithBlockProps<FullImageGalleryBlockFragment>;
export type BuilderQuoteBlockProps = WithBlockProps<FullQuoteBlockFragment>;
export type BuilderEventBlockProps = WithBlockProps<FullEventBlockFragment>;
export type BuilderRichTextBlockProps =
  WithBlockProps<FullRichTextBlockFragment>;
export type BuilderHTMLBlockProps = WithBlockProps<FullHtmlBlockFragment>;
export type BuilderFacebookPostBlockProps =
  WithBlockProps<FullFacebookPostBlockFragment>;
export type BuilderFacebookVideoBlockProps =
  WithBlockProps<FullFacebookVideoBlockFragment>;
export type BuilderInstagramPostBlockProps =
  WithBlockProps<FullInstagramPostBlockFragment>;
export type BuilderTwitterTweetBlockProps =
  WithBlockProps<FullTwitterTweetBlockFragment>;
export type BuilderVimeoVideoBlockProps =
  WithBlockProps<FullVimeoVideoBlockFragment>;
export type BuilderStreamableVideoBlockProps =
  WithBlockProps<FullStreamableVideoBlockFragment>;
export type BuilderYouTubeVideoBlockProps =
  WithBlockProps<FullYouTubeVideoBlockFragment>;
export type BuilderSoundCloudTrackBlockProps =
  WithBlockProps<FullSoundCloudTrackBlockFragment>;
export type BuilderPolisConversationBlockProps =
  WithBlockProps<FullPolisConversationBlockFragment>;
export type BuilderTikTokVideoBlockProps =
  WithBlockProps<FullTikTokVideoBlockFragment>;
export type BuilderBildwurfAdBlockProps =
  WithBlockProps<FullBildwurfAdBlockFragment>;
export type BuilderIFrameBlockProps = WithBlockProps<FullIFrameBlockFragment>;
export type BuilderPollBlockProps = WithBlockProps<FullPollBlockFragment>;
export type BuilderCrowdfundingBlockProps =
  WithBlockProps<FullCrowdfundingBlockFragment>;
export type BuilderListicleBlockProps =
  WithBlockProps<FullListicleBlockFragment>;
export type BuilderCommentBlockProps = WithBlockProps<FullCommentBlockFragment>;
export type BuilderSubscribeBlockProps =
  WithBlockProps<FullSubscribeBlockFragment>;
export type BuilderTeaserGridFlexBlockProps =
  WithBlockProps<FullTeaserGridFlexBlockFragment>;
export type BuilderTeaserGridBlockProps =
  WithBlockProps<FullTeaserGridBlockFragment>;
export type BuilderTeaserListBlockProps =
  WithBlockProps<FullTeaserListBlockFragment>;
export type BuilderTeaserSlotsBlockProps =
  WithBlockProps<FullTeaserSlotsBlockFragment>;
