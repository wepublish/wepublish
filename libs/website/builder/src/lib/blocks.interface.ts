import {
  FullBildwurfAdBlockFragment,
  FullBlockFragment,
  FullBreakBlockFragment,
  FullCommentBlockFragment,
  FullCrowdfundingBlockFragment,
  FullEventBlockFragment,
  FullFacebookPostBlockFragment,
  FullFacebookVideoBlockFragment,
  FullFlexBlockFragment,
  FullHtmlBlockFragment,
  FullIFrameBlockFragment,
  FullImageBlockFragment,
  FullImageGalleryBlockFragment,
  FullInstagramPostBlockFragment,
  FullListicleBlockFragment,
  FullPolisConversationBlockFragment,
  FullPollBlockFragment,
  FullQuoteBlockFragment,
  FullRichTextBlockFragment,
  FullSoundCloudTrackBlockFragment,
  FullStreamableVideoBlockFragment,
  FullSubscribeBlockFragment,
  FullTeaserGridBlockFragment,
  FullTeaserGridFlexBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
  FullTikTokVideoBlockFragment,
  FullTitleBlockFragment,
  FullTwitterTweetBlockFragment,
  FullVimeoVideoBlockFragment,
  FullYouTubeVideoBlockFragment,
} from '@wepublish/website/api';

export type BlockSibling = {
  typeName: string;
  blockStyle?: string;
};

export type BuilderBlockRendererProps = {
  className?: string;
  siblings?: Array<BlockSibling>;
  block: FullBlockFragment;
  index: number;
  count: number;
  type: 'Page' | 'Article' | 'PageNested' | 'ArticleNested' | 'Custom';
};

export type BuilderBlocksProps = {
  blocks: FullBlockFragment[];
  type: BuilderBlockRendererProps['type'];
};

export type BlockProps = {
  className?: string;
  siblings?: Array<BlockSibling>;
};

type WithBlockProps<T> = Omit<T, 'type'> & BlockProps;

export const toNestedBlockType = (
  type?: BuilderBlockRendererProps['type']
): BuilderBlockRendererProps['type'] =>
  type === 'Page' || type === 'PageNested' ? 'PageNested' : 'ArticleNested';

export type BuilderFlexBlockProps = WithBlockProps<FullFlexBlockFragment> & {
  type?: BuilderBlockRendererProps['type'];
};
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
