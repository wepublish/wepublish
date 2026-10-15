import {
  FullImageGalleryBlockFragment,
  FullBreakBlockFragment,
  FullTitleBlockFragment,
  FullBlockTemplateBlockFragment,
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
  FullAuthorBlockFragment,
  FullPollBlockFragment,
  FullQuoteBlockFragment,
  FullRichTextBlockFragment,
  FullSoundCloudTrackBlockFragment,
  FullStreamableVideoBlockFragment,
  FullSubscribeBlockFragment,
  FullMailchimpFormBlockFragment,
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

/**
 * The regenerated types mark nullable fields as required (`avoidOptionals`);
 * block components were written against the old optional (`?:`) shape, so
 * make every nullable field (and `__typename`) optional again.
 */
type OptionalBlockKeys<T> =
  | Extract<keyof T, '__typename'>
  | { [K in keyof T]: null extends T[K] ? K : never }[keyof T];
type WithBlockProps<T> = Omit<T, 'type' | OptionalBlockKeys<T>> &
  Partial<Pick<T, OptionalBlockKeys<T>>> &
  BlockProps;

export type BuilderFlexBlockProps = WithBlockProps<FullFlexBlockFragment>;
export type BuilderBlockTemplateBlockProps =
  WithBlockProps<FullBlockTemplateBlockFragment>;
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
export type BuilderMailchimpFormBlockProps =
  WithBlockProps<FullMailchimpFormBlockFragment>;
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
export type BuilderAuthorBlockProps = WithBlockProps<FullAuthorBlockFragment>;
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
