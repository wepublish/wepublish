import {BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block, Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html/html-block'
import {isImageBlock} from './image/image-block'
import {isQuoteBlock} from './quote/quote-block'
import {isRichTextBlock} from './richtext/richtext-block'
import {isTeaserGridFlexBlock} from './teaser/teaser-grid-flex-block'
import {isTitleBlock} from './title/title-block'
import {cond} from 'ramda'
import {isEmbedBlock} from './embed/embed-block'
import {isCommentBlock} from './comment/comment-block'
import {isBildwurfAdBlock} from './bildwurf-ad/bildwurf-ad-block'
import {isFacebookPostBlock} from './facebook/facebook-post-block'
import {isFacebookVideoBlock} from './facebook/facebook-video-block'
import {isInstagramBlock} from './instagram/instagram-post-block'
import {isSoundCloudTrackBlock} from './sound-cloud/sound-cloud-block'
import {isTikTokVideoBlock} from './tik-tok/tik-tok-video-block'
import {isTwitterTweetBlock} from './twitter/twitter-tweet-block'
import {isVimeoVideoBlock} from './vimeo/vimeo-video-block'
import {isYouTubeVideoBlock} from './youtube/youtube-video-block'
import {isTeaserGridBlock} from './teaser/teaser-grid-block'
import {isImageGalleryBlock} from './image-gallery/image-gallery-block'
import {isPollBlock} from './poll/poll-block'
import {isListicleBlock} from './listicle/listicle-block'
import {isEventBlock} from './event/event-block'
import {isPolisConversationBlock} from './polis-conversation/polis-conversation-block'
import {isBreakBlock} from './break/break-block'
import {memo} from 'react'

export const hasBlockStyle = (blockStyle: string) => (block: Block) =>
  block.blockStyle === blockStyle

export const BlockRenderer = memo(({block}: BuilderBlockRendererProps) => {
  const {blocks} = useWebsiteBuilder()

  const facebookEmbedCond = cond([
    [isFacebookPostBlock, block => <blocks.FacebookPost {...block} />],
    [isFacebookVideoBlock, block => <blocks.FacebookVideo {...block} />]
  ])

  const embedCond = cond([
    [isEmbedBlock, block => <blocks.Embed {...block} />],
    [isBildwurfAdBlock, block => <blocks.BildwurfAd {...block} />],
    [isInstagramBlock, block => <blocks.InstagramPost {...block} />],
    [isSoundCloudTrackBlock, block => <blocks.SoundCloudTrack {...block} />],
    [isTikTokVideoBlock, block => <blocks.TikTokVideo {...block} />],
    [isTwitterTweetBlock, block => <blocks.TwitterTweet {...block} />],
    [isVimeoVideoBlock, block => <blocks.VimeoVideo {...block} />],
    [isYouTubeVideoBlock, block => <blocks.YouTubeVideo {...block} />],
    [isPolisConversationBlock, block => <blocks.PolisConversation {...block} />]
  ])

  const teaserCond = cond([
    [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />],
    [isTeaserGridBlock, block => <blocks.TeaserGrid {...block} />]
  ])

  const imageCond = cond([
    [isImageBlock, block => <blocks.Image {...block} />],
    [isImageGalleryBlock, block => <blocks.ImageGallery {...block} />]
  ])

  return (
    facebookEmbedCond(block) ??
    embedCond(block) ??
    teaserCond(block) ??
    imageCond(block) ??
    cond([
      [isTitleBlock, block => <blocks.Title {...block} />],
      [isQuoteBlock, block => <blocks.Quote {...block} />],
      [isBreakBlock, block => <blocks.Break {...block} />],
      [isRichTextBlock, block => <blocks.RichText {...block} />],
      [isHtmlBlock, block => <blocks.HTML {...block} />],
      [isEventBlock, block => <blocks.Event {...block} />],
      [isPollBlock, block => <blocks.Poll {...block} />],
      [isListicleBlock, block => <blocks.Listicle {...block} />],
      [isCommentBlock, block => <blocks.Comment {...block} />]
    ])(block)
  )
})

export type BlocksProp = {
  blocks: BlockType[]
}

export const Blocks = ({blocks}: BlocksProp) => {
  const {
    blocks: {Renderer}
  } = useWebsiteBuilder()

  return (
    <>
      {blocks.map((block, index) => (
        <Renderer key={index} block={block} />
      ))}
    </>
  )
}
