import {
  BlockContent,
  EventBlock,
  FlexAlignment,
  HtmlBlock,
  ImageBlock,
  ImageGalleryBlock,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  Teaser,
  TeaserGridBlock,
  TwitterTweetBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  InstagramPostBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock,
  SoundCloudTrackBlock,
  PolisConversationBlock,
  TikTokVideoBlock,
  BildwurfAdBlock,
  IFrameBlock,
  ListicleBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  BreakBlock,
  CommentBlock,
  TeaserListBlock,
  SubscribeBlock,
  CrowdfundingBlock
} from '@wepublish/website/api'

export type BuilderBlockRendererProps = {
  block: BlockContent
  index: number
  count: number
  type: 'Page' | 'Article'
}

export type BuilderBlocksProps = {
  blocks: BlockContent[]
  type: BuilderBlockRendererProps['type']
}

export type BuilderTitleBlockProps = Omit<TitleBlock, 'type'> & {className?: string}
export type BuilderBreakBlockProps = Omit<BreakBlock, 'type'> & {className?: string}
export type BuilderImageBlockProps = Omit<ImageBlock, 'type'> & {className?: string}
export type BuilderImageGalleryBlockProps = Omit<ImageGalleryBlock, 'type'> & {className?: string}
export type BuilderQuoteBlockProps = Omit<QuoteBlock, 'type'> & {className?: string}
export type BuilderEventBlockProps = Omit<EventBlock, 'type'> & {className?: string}
export type BuilderRichTextBlockProps = Omit<RichTextBlock, 'type'> & {className?: string}
export type BuilderHTMLBlockProps = Omit<HtmlBlock, 'type'> & {className?: string}
export type BuilderFacebookPostBlockProps = Omit<FacebookPostBlock, 'type'> & {className?: string}
export type BuilderFacebookVideoBlockProps = Omit<FacebookVideoBlock, 'type'> & {className?: string}
export type BuilderInstagramPostBlockProps = Omit<InstagramPostBlock, 'type'> & {className?: string}
export type BuilderTwitterTweetBlockProps = Omit<TwitterTweetBlock, 'type'> & {className?: string}
export type BuilderVimeoVideoBlockProps = Omit<VimeoVideoBlock, 'type'> & {className?: string}
export type BuilderYouTubeVideoBlockProps = Omit<YouTubeVideoBlock, 'type'> & {className?: string}
export type BuilderSoundCloudTrackBlockProps = Omit<SoundCloudTrackBlock, 'type'> & {
  className?: string
}
export type BuilderPolisConversationBlockProps = Omit<PolisConversationBlock, 'type'> & {
  className?: string
}
export type BuilderTikTokVideoBlockProps = Omit<TikTokVideoBlock, 'type'> & {className?: string}
export type BuilderBildwurfAdBlockProps = Omit<BildwurfAdBlock, 'type'> & {className?: string}
export type BuilderIFrameBlockProps = Omit<IFrameBlock, 'type'> & {className?: string}
export type BuilderPollBlockProps = Omit<PollBlock, 'type'> & {className?: string}
export type BuilderCrowdfundingBlockProps = Omit<CrowdfundingBlock, 'type' & {className?: string}>
export type BuilderListicleBlockProps = Omit<ListicleBlock, 'type'> & {className?: string}
export type BuilderCommentBlockProps = Omit<CommentBlock, 'type'> & {className?: string}
export type BuilderSubscribeBlockProps = Omit<SubscribeBlock, 'type'> & {className?: string}
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string
}
export type BuilderTeaserGridBlockProps = Omit<TeaserGridBlock, 'type'> & {
  className?: string
}

export type BuilderTeaserListBlockProps = Omit<TeaserListBlock, 'type'> & {
  className?: string
}

type TeaserTypeProps =
  | {
      blockStyle: string | null | undefined
      teaser?: Teaser | null | undefined
      alignment: FlexAlignment
      numColumns?: never
    }
  | {
      blockStyle: string | null | undefined
      teaser: Teaser | null | undefined
      alignment: FlexAlignment
      numColumns: number
    }

export type BuilderTeaserProps = TeaserTypeProps & {className?: string}
