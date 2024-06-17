import {createUnionType, Field, InputType} from '@nestjs/graphql'
import {RichTextBlock, RichTextBlockInput} from './model/richtext'
import {ImageBlock, ImageBlockInput} from './model/image'
import {ImageGalleryBlock, ImageGalleryBlockInput} from './model/image-gallery'
import {QuoteBlock, QuoteBlockInput} from './model/quote'
import {ListicleBlock, ListicleBlockInput} from './model/listicle'
import {TitleBlock, TitleBlockInput} from './model/title'
import {FacebookPostBlock, FacebookPostBlockInput} from './model/facebook-post'
import {FacebookVideoBlock, FacebookVideoBlockInput} from './model/facebook-video'
import {InstagramPostBlock, InstagramPostBlockInput} from './model/instagram-post'
import {TwitterTweetBlock, TwitterTweetBlockInput} from './model/twitter-tweet'
import {VimeoVideoBlock, VimeoVideoBlockInput} from './model/vimeo-video'
import {YouTubeVideoBlock, YouTubeVideoBlockInput} from './model/youtube-video'
import {SoundCloudTrackBlock, SoundCloudTrackBlockInput} from './model/soundcloud'
import {PolisConversationBlock, PolisConversationBlockInput} from './model/polis-conversation'
import {TikTokVideoBlock, TikTokVideoBlockInput} from './model/tiktok-video'
import {BildwurfAdBlock, BildwurfAdBlockInput} from './model/bildwurf-ad'
import {HTMLBlock, HTMLBlockInput} from './model/html'
import {PollBlock, PollBlockInput} from './model/poll'
import {EventBlock, EventBlockInput} from './model/event'
import {CommentBlock, CommentBlockInput} from './model/comment'
import {LinkPageBreakBlock, LinkPageBreakBlockInput} from './model/link-page-break'
import {TeaserGridBlock, TeaserGridBlockInput} from './model/teaser-grid'
import {TeaserGridFlexBlock, TeaserGridFlexBlockInput} from './model/teaser-flex-grid'
import {TeaserListBlock, TeaserListBlockInput} from './model/teaser-list'

import {EmbedBlock} from './model/embed'

export const Block = createUnionType({
  name: 'Block',
  types: () => [
    RichTextBlock,
    ImageBlock,
    ImageGalleryBlock,
    ListicleBlock,
    FacebookPostBlock,
    FacebookVideoBlock,
    InstagramPostBlock,
    TwitterTweetBlock,
    VimeoVideoBlock,
    YouTubeVideoBlock,
    SoundCloudTrackBlock,
    PolisConversationBlock,
    TikTokVideoBlock,
    BildwurfAdBlock,
    EmbedBlock,
    HTMLBlock,
    PollBlock,
    EventBlock,
    CommentBlock,
    LinkPageBreakBlock,
    TitleBlock,
    QuoteBlock,
    TeaserGridBlock,
    TeaserGridFlexBlock,
    TeaserListBlock
  ]
})

@InputType()
export class BlockInput {
  @Field(() => RichTextBlockInput, {nullable: true})
  richText?: RichTextBlockInput

  @Field(() => ImageBlockInput, {nullable: true})
  image?: ImageBlockInput

  @Field(() => ImageGalleryBlockInput, {nullable: true})
  imageGallery?: ImageGalleryBlockInput

  @Field(() => ListicleBlockInput, {nullable: true})
  listicle?: ListicleBlockInput

  @Field(() => TitleBlockInput, {nullable: true})
  title?: TitleBlockInput

  @Field(() => QuoteBlockInput, {nullable: true})
  quote?: QuoteBlockInput

  @Field(() => FacebookPostBlockInput, {nullable: true})
  facebookPost?: FacebookPostBlockInput

  @Field(() => FacebookVideoBlockInput, {nullable: true})
  facebookVideo?: FacebookVideoBlockInput

  @Field(() => InstagramPostBlockInput, {nullable: true})
  instagramPost?: InstagramPostBlockInput

  @Field(() => TwitterTweetBlockInput, {nullable: true})
  twitterTweet?: TwitterTweetBlockInput

  @Field(() => VimeoVideoBlockInput, {nullable: true})
  vimeoVideo?: VimeoVideoBlockInput

  @Field(() => YouTubeVideoBlockInput, {nullable: true})
  youTubeVideo?: YouTubeVideoBlockInput

  @Field(() => SoundCloudTrackBlockInput, {nullable: true})
  soundCloudTrack?: SoundCloudTrackBlockInput

  @Field(() => PolisConversationBlockInput, {nullable: true})
  polisConversation?: PolisConversationBlockInput

  @Field(() => TikTokVideoBlockInput, {nullable: true})
  tikTokVideo?: TikTokVideoBlockInput

  @Field(() => BildwurfAdBlockInput, {nullable: true})
  bildwurfAd?: BildwurfAdBlockInput

  @Field(() => HTMLBlockInput, {nullable: true})
  html?: HTMLBlockInput

  @Field(() => PollBlockInput, {nullable: true})
  poll?: PollBlockInput

  @Field(() => EventBlockInput, {nullable: true})
  event?: EventBlockInput

  @Field(() => CommentBlockInput, {nullable: true})
  comment?: CommentBlockInput

  @Field(() => LinkPageBreakBlockInput, {nullable: true})
  linkPageBreak?: LinkPageBreakBlockInput

  @Field(() => TeaserGridBlockInput, {nullable: true})
  teaserGrid?: TeaserGridBlockInput

  @Field(() => TeaserGridFlexBlockInput, {nullable: true})
  teaserGridFlex?: TeaserGridFlexBlockInput

  @Field(() => TeaserListBlockInput, {nullable: true})
  teaserList?: TeaserListBlockInput
}
