import {
  FlexAlignment,
  HtmlBlock,
  ImageBlock,
  ImageGalleryBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  Teaser,
  Block,
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
  BildwurfAdBlock
} from '@wepublish/website/api'

export enum EmbedType {
  FacebookPost = 'facebookPost',
  FacebookVideo = 'facebookVideo',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  PolisConversation = 'polisConversation',
  TikTokVideo = 'tikTokVideo',
  BildwurfAd = 'bildwurfAd',
  Other = 'other'
}

export type EmbedBlockType =
  | ({type: EmbedType.FacebookPost} & FacebookPostBlock)
  | ({type: EmbedType.FacebookVideo} & FacebookVideoBlock)
  | ({type: EmbedType.InstagramPost} & InstagramPostBlock)
  | ({type: EmbedType.TwitterTweet} & TwitterTweetBlock)
  | ({type: EmbedType.VimeoVideo} & VimeoVideoBlock)
  | ({type: EmbedType.YouTubeVideo} & YouTubeVideoBlock)
  | ({type: EmbedType.SoundCloudTrack} & SoundCloudTrackBlock)
  | ({type: EmbedType.PolisConversation} & PolisConversationBlock)
  | ({type: EmbedType.TikTokVideo} & TikTokVideoBlock)
  | ({type: EmbedType.BildwurfAd} & BildwurfAdBlock)
  | ({type: EmbedType.Other} & {
      type: EmbedType.Other
      url?: string | null
      title?: string | null
      width?: number | null
      height?: number | null
      styleCustom?: string | null
      sandbox?: string | null
    })

export type BuilderBlockRendererProps = {block: Block}
export type BuilderTitleBlockProps = TitleBlock & {className?: string}
export type BuilderImageBlockProps = ImageBlock & {className?: string}
export type BuilderImageGalleryBlockProps = ImageGalleryBlock & {className?: string}
export type BuilderQuoteBlockProps = QuoteBlock & {className?: string}
export type BuilderRichTextBlockProps = RichTextBlock & {className?: string}
export type BuilderHTMLBlockProps = HtmlBlock & {className?: string}
export type BuilderEmbedBlockProps = EmbedBlockType & {className?: string}
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string
  showLead?: boolean
}
export type BuilderTeaserGridBlockProps = TeaserGridBlock & {
  className?: string
  showLead?: boolean
}

export type BuilderTeaserProps = {
  teaser?: Teaser | null
  alignment: FlexAlignment
  showLead?: boolean
} & {className?: string}
