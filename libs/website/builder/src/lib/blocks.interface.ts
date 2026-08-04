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
};

export type BuilderBlocksProps = {
  blocks: FullBlockFragment[];
  type: BuilderBlockRendererProps['type'];
};

export type BuilderFlexBlockProps = FullFlexBlockFragment & {
  className?: string;
};

export type BuilderTitleBlockProps = Omit<FullTitleBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderBreakBlockProps = Omit<FullBreakBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderImageBlockProps = Omit<FullImageBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderImageGalleryBlockProps = Omit<
  FullImageGalleryBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderQuoteBlockProps = Omit<FullQuoteBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderEventBlockProps = Omit<FullEventBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderRichTextBlockProps = Omit<
  FullRichTextBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderHTMLBlockProps = Omit<FullHtmlBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderFacebookPostBlockProps = Omit<
  FullFacebookPostBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderFacebookVideoBlockProps = Omit<
  FullFacebookVideoBlockFragment,
  'type'
> & { className?: string };
export type BuilderInstagramPostBlockProps = Omit<
  FullInstagramPostBlockFragment,
  'type'
> & { className?: string };
export type BuilderTwitterTweetBlockProps = Omit<
  FullTwitterTweetBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderVimeoVideoBlockProps = Omit<
  FullVimeoVideoBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderStreamableVideoBlockProps = Omit<
  FullStreamableVideoBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderYouTubeVideoBlockProps = Omit<
  FullYouTubeVideoBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderSoundCloudTrackBlockProps = Omit<
  FullSoundCloudTrackBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderPolisConversationBlockProps = Omit<
  FullPolisConversationBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderTikTokVideoBlockProps = Omit<
  FullTikTokVideoBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderBildwurfAdBlockProps = Omit<
  FullBildwurfAdBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderIFrameBlockProps = Omit<FullIFrameBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderPollBlockProps = Omit<FullPollBlockFragment, 'type'> & {
  className?: string;
};
export type BuilderCrowdfundingBlockProps = Omit<
  FullCrowdfundingBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderListicleBlockProps = Omit<
  FullListicleBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderCommentBlockProps = Omit<
  FullCommentBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderSubscribeBlockProps = Omit<
  FullSubscribeBlockFragment,
  'type'
> & {
  className?: string;
};
export type BuilderTeaserGridFlexBlockProps =
  FullTeaserGridFlexBlockFragment & {
    className?: string;
  };
export type BuilderTeaserGridBlockProps = Omit<
  FullTeaserGridBlockFragment,
  'type'
> & {
  className?: string;
};

export type BuilderTeaserListBlockProps = Omit<
  FullTeaserListBlockFragment,
  'type'
> & {
  className?: string;
};

export type BuilderTeaserSlotsBlockProps = Omit<
  FullTeaserSlotsBlockFragment,
  'type'
> & {
  className?: string;
};
