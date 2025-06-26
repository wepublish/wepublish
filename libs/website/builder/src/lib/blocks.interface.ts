import {
  BaseBlock,
  BildwurfAdBlock,
  BlockContent,
  BreakBlock,
  CommentBlock,
  CrowdfundingBlock,
  EventBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  FlexAlignment,
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
  Teaser,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TeaserListBlock,
  TeaserSlotsBlock,
  TikTokVideoBlock,
  TitleBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock
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

export type BlockProps<T extends BaseBlock> = Omit<T, 'type'> & {className?: string}

export type BuilderTitleBlockProps = BlockProps<TitleBlock>
export type BuilderBreakBlockProps = BlockProps<BreakBlock>
export type BuilderImageBlockProps = BlockProps<ImageBlock>
export type BuilderImageGalleryBlockProps = BlockProps<ImageGalleryBlock>
export type BuilderQuoteBlockProps = BlockProps<QuoteBlock>
export type BuilderEventBlockProps = BlockProps<EventBlock>
export type BuilderRichTextBlockProps = BlockProps<RichTextBlock>
export type BuilderHTMLBlockProps = BlockProps<HtmlBlock>
export type BuilderFacebookPostBlockProps = BlockProps<FacebookPostBlock>
export type BuilderFacebookVideoBlockProps = BlockProps<FacebookVideoBlock>
export type BuilderInstagramPostBlockProps = BlockProps<InstagramPostBlock>
export type BuilderTwitterTweetBlockProps = BlockProps<TwitterTweetBlock>
export type BuilderVimeoVideoBlockProps = BlockProps<VimeoVideoBlock>
export type BuilderYouTubeVideoBlockProps = BlockProps<YouTubeVideoBlock>
export type BuilderSoundCloudTrackBlockProps = BlockProps<SoundCloudTrackBlock>
export type BuilderPolisConversationBlockProps = BlockProps<PolisConversationBlock>
export type BuilderTikTokVideoBlockProps = BlockProps<TikTokVideoBlock>
export type BuilderBildwurfAdBlockProps = BlockProps<BildwurfAdBlock>
export type BuilderIFrameBlockProps = BlockProps<IFrameBlock>
export type BuilderPollBlockProps = BlockProps<PollBlock>
export type BuilderCrowdfundingBlockProps = BlockProps<CrowdfundingBlock>
export type BuilderListicleBlockProps = BlockProps<ListicleBlock>
export type BuilderCommentBlockProps = BlockProps<CommentBlock>
export type BuilderSubscribeBlockProps = BlockProps<SubscribeBlock>
export type BuilderTeaserGridFlexBlockProps = BlockProps<TeaserGridFlexBlock>
export type BuilderTeaserGridBlockProps = BlockProps<TeaserGridBlock>
export type BuilderTeaserListBlockProps = BlockProps<TeaserListBlock>
export type BuilderTeaserSlotsBlockProps = BlockProps<TeaserSlotsBlock>

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
