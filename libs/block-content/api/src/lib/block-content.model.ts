import {createUnionType, Field, InterfaceType} from '@nestjs/graphql'
import {QuoteBlock} from './quote/quote-block.model'
import {RichTextBlock} from './richtext/richtext-block.model'
import {BaseBlock, UnknownBlock} from './base-block.model'
import {HTMLBlock} from './html/html-block.model'
import {TitleBlock} from './title/title-block.model'
import {ImageBlock} from './image/image-block.model'
import {BreakBlock} from './break/break-block.model'
import {EventBlock} from './event/event-block.model'
import {CommentBlock} from './comment/comment-block.model'
import {PollBlock} from './poll/poll.model'
import {ImageGalleryBlock} from './image/image-gallery-block.model'
import {BlockType} from './block-type.model'
import {IFrameBlock} from './embed/iframe-block.model'
import {BildwurfAdBlock} from './embed/bildwurf-block.model'
import {FacebookPostBlock, FacebookVideoBlock} from './embed/facebook-block.model'
import {InstagramPostBlock} from './embed/instagram-block.model'
import {PolisConversationBlock} from './embed/polis-block.model'
import {SoundCloudTrackBlock} from './embed/soundcloud-block.model'
import {TikTokVideoBlock} from './embed/tiktok-block.model'
import {TwitterTweetBlock} from './embed/twitter-block.model'
import {VimeoVideoBlock} from './embed/vimeo-block.model'
import {YouTubeVideoBlock} from './embed/youtube-block.model'
import {ListicleBlock} from './listicle/listicle.model'
import {TeaserGridBlock} from './teaser/teaser-grid.model'
import {TeaserGridFlexBlock} from './teaser/teaser-flex.model'

export const BlockContent = createUnionType({
  name: 'BlockContent',
  types: () =>
    [
      UnknownBlock,
      QuoteBlock,
      RichTextBlock,
      ListicleBlock,
      HTMLBlock,
      TitleBlock,
      ImageBlock,
      ImageGalleryBlock,
      BreakBlock,
      EventBlock,
      CommentBlock,
      PollBlock,
      IFrameBlock,
      BildwurfAdBlock,
      FacebookPostBlock,
      FacebookVideoBlock,
      InstagramPostBlock,
      PolisConversationBlock,
      SoundCloudTrackBlock,
      TikTokVideoBlock,
      TwitterTweetBlock,
      VimeoVideoBlock,
      YouTubeVideoBlock,
      TeaserGridBlock,
      TeaserGridFlexBlock
    ] as const,
  resolveType: (value: BaseBlock<string>) => {
    switch (value.type) {
      case BlockType.RichText:
        return RichTextBlock.name
      case BlockType.Quote:
        return QuoteBlock.name
      case BlockType.Listicle:
        return ListicleBlock.name
      case BlockType.HTML:
        return HTMLBlock.name
      case BlockType.Title:
        return TitleBlock.name
      case BlockType.Image:
        return ImageBlock.name
      case BlockType.ImageGallery:
        return ImageGalleryBlock.name
      case BlockType.LinkPageBreak:
        return BreakBlock.name
      case BlockType.Poll:
        return PollBlock.name
      case BlockType.Event:
        return EventBlock.name
      case BlockType.Comment:
        return CommentBlock.name
      case BlockType.Embed:
        return IFrameBlock.name
      case BlockType.BildwurfAd:
        return BildwurfAdBlock.name
      case BlockType.FacebookPost:
        return FacebookPostBlock.name
      case BlockType.FacebookVideo:
        return FacebookVideoBlock.name
      case BlockType.InstagramPost:
        return InstagramPostBlock.name
      case BlockType.PolisConversation:
        return PolisConversationBlock.name
      case BlockType.SoundCloudTrack:
        return SoundCloudTrackBlock.name
      case BlockType.TikTokVideo:
        return TikTokVideoBlock.name
      case BlockType.TwitterTweet:
        return TwitterTweetBlock.name
      case BlockType.VimeoVideo:
        return VimeoVideoBlock.name
      case BlockType.YouTubeVideo:
        return YouTubeVideoBlock.name
      case BlockType.TeaserGrid:
        return TeaserGridBlock.name
      case BlockType.TeaserGridFlex:
        return TeaserGridFlexBlock.name
    }

    console.warn(`Block ${value.type} not implemented!`)

    return UnknownBlock.name
  }
})

@InterfaceType()
export class HasBlockContent {
  @Field(() => [BlockContent])
  blocks!: Array<typeof BlockContent>
}
