import {
  Block,
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
  EmbedBlock,
  ListicleBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  LinkPageBreakBlock
} from '@wepublish/website/api'

export type BuilderBlockRendererProps = {block: Block}
export type BuilderTitleBlockProps = TitleBlock & {className?: string}
export type BuilderBreakBlockProps = LinkPageBreakBlock & {className?: string}
export type BuilderImageBlockProps = ImageBlock & {className?: string}
export type BuilderImageGalleryBlockProps = ImageGalleryBlock & {className?: string}
export type BuilderQuoteBlockProps = QuoteBlock & {className?: string}
export type BuilderEventBlockProps = EventBlock & {className?: string}
export type BuilderRichTextBlockProps = RichTextBlock & {className?: string}
export type BuilderHTMLBlockProps = HtmlBlock & {className?: string}
export type BuilderFacebookPostBlockProps = FacebookPostBlock & {className?: string}
export type BuilderFacebookVideoBlockProps = FacebookVideoBlock & {className?: string}
export type BuilderInstagramPostBlockProps = InstagramPostBlock & {className?: string}
export type BuilderTwitterTweetBlockProps = TwitterTweetBlock & {className?: string}
export type BuilderVimeoVideoBlockProps = VimeoVideoBlock & {className?: string}
export type BuilderYouTubeVideoBlockProps = YouTubeVideoBlock & {className?: string}
export type BuilderSoundCloudTrackBlockProps = SoundCloudTrackBlock & {className?: string}
export type BuilderPolisConversationBlockProps = PolisConversationBlock & {className?: string}
export type BuilderTikTokVideoBlockProps = TikTokVideoBlock & {className?: string}
export type BuilderBildwurfAdBlockProps = BildwurfAdBlock & {className?: string}
export type BuilderEmbedBlockProps = EmbedBlock & {className?: string}
export type BuilderPollBlockProps = PollBlock & {className?: string}
export type BuilderListicleBlockProps = ListicleBlock & {className?: string}
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string
}
export type BuilderTeaserGridBlockProps = TeaserGridBlock & {
  className?: string
}

export type BuilderTeaserProps = {
  teaser?: Teaser | null
  alignment: FlexAlignment
} & {className?: string}
