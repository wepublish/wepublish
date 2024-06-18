import {createUnionType, Field, InputType, registerEnumType} from '@nestjs/graphql'
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

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
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
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid = 'teaserGrid',
  TeaserGridFlex = 'teaserGridFlex',
  TeaserList = 'teaserList',
  HTML = 'html',
  Poll = 'poll',
  Comment = 'comment',
  Event = 'event'
}

registerEnumType(BlockType, {name: 'BlockType'})

export const BlockUnion = createUnionType({
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
export type Block = typeof BlockUnion

@InputType()
export class BlockInput {
  @Field(() => RichTextBlockInput, {nullable: true})
  [BlockType.RichText]?: RichTextBlockInput;

  @Field(() => ImageBlockInput, {nullable: true})
  [BlockType.Image]?: ImageBlockInput;

  @Field(() => ImageGalleryBlockInput, {nullable: true})
  [BlockType.ImageGallery]?: ImageGalleryBlockInput;

  @Field(() => ListicleBlockInput, {nullable: true})
  [BlockType.Listicle]?: ListicleBlockInput;

  @Field(() => TitleBlockInput, {nullable: true})
  [BlockType.Title]?: TitleBlockInput;

  @Field(() => QuoteBlockInput, {nullable: true})
  [BlockType.Quote]?: QuoteBlockInput;

  @Field(() => FacebookPostBlockInput, {nullable: true})
  [BlockType.FacebookPost]?: FacebookPostBlockInput;

  @Field(() => FacebookVideoBlockInput, {nullable: true})
  [BlockType.FacebookVideo]?: FacebookVideoBlockInput;

  @Field(() => InstagramPostBlockInput, {nullable: true})
  [BlockType.InstagramPost]?: InstagramPostBlockInput;

  @Field(() => TwitterTweetBlockInput, {nullable: true})
  [BlockType.TwitterTweet]?: TwitterTweetBlockInput;

  @Field(() => VimeoVideoBlockInput, {nullable: true})
  [BlockType.VimeoVideo]?: VimeoVideoBlockInput;

  @Field(() => YouTubeVideoBlockInput, {nullable: true})
  [BlockType.YouTubeVideo]?: YouTubeVideoBlockInput;

  @Field(() => SoundCloudTrackBlockInput, {nullable: true})
  [BlockType.SoundCloudTrack]?: SoundCloudTrackBlockInput;

  @Field(() => PolisConversationBlockInput, {nullable: true})
  [BlockType.PolisConversation]?: PolisConversationBlockInput;

  @Field(() => TikTokVideoBlockInput, {nullable: true})
  [BlockType.TikTokVideo]?: TikTokVideoBlockInput;

  @Field(() => BildwurfAdBlockInput, {nullable: true})
  [BlockType.BildwurfAd]?: BildwurfAdBlockInput;

  @Field(() => HTMLBlockInput, {nullable: true})
  [BlockType.HTML]?: HTMLBlockInput;

  @Field(() => PollBlockInput, {nullable: true})
  [BlockType.Poll]?: PollBlockInput;

  @Field(() => EventBlockInput, {nullable: true})
  [BlockType.Event]?: EventBlockInput;

  @Field(() => CommentBlockInput, {nullable: true})
  [BlockType.Comment]?: CommentBlockInput;

  @Field(() => LinkPageBreakBlockInput, {nullable: true})
  [BlockType.LinkPageBreak]?: LinkPageBreakBlockInput;

  @Field(() => TeaserGridBlockInput, {nullable: true})
  [BlockType.TeaserGrid]?: TeaserGridBlockInput;

  @Field(() => TeaserGridFlexBlockInput, {nullable: true})
  [BlockType.TeaserGridFlex]?: TeaserGridFlexBlockInput;

  @Field(() => TeaserListBlockInput, {nullable: true})
  [BlockType.TeaserList]?: TeaserListBlockInput
}
