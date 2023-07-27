import {BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html-block'
import {isImageBlock} from './image-block'
import {isQuoteBlock} from './quote-block'
import {isRichTextBlock} from './richtext-block'
import {isTeaserGridFlexBlock} from './teaser-grid-flex-block'
import {isTitleBlock} from './title-block'
import {cond} from 'ramda'
import {isTeaserGridBlock} from './teaser-grid-block'
import {isImageGalleryBlock} from './image-gallery-block'
import {isEmbedBlock} from './embed-block'
import {isBildwurfAdBlock} from './bildwurf-ad-block'
import {isFacebookPostBlock} from './facebook-post-block'
import {isFacebookVideoBlock} from './facebook-video-block'
import {isInstagramBlock} from './instagram-post-block'
import {isSoundCloudTrackBlock} from './sound-cloud-block'
import {isTikTokVideoBlock} from './tik-tok-video-block'
import {isTwitterTweetBlock} from './twitter-tweet-block'
import {isVimeoVideoBlock} from './vimeo-video-block'
import {isYouTubeVideoBlock} from './youtube-video-block'

export const BlockRenderer = ({block}: BuilderBlockRendererProps) => {
  const {blocks} = useWebsiteBuilder()

  const embedCond = cond([
    [isEmbedBlock, block => <blocks.Embed {...block} />],
    [isBildwurfAdBlock, block => <blocks.BildwurfAd {...block} />],
    [isFacebookPostBlock, block => <blocks.FacebookPost {...block} />],
    [isFacebookVideoBlock, block => <blocks.FacebookVideo {...block} />],
    [isInstagramBlock, block => <blocks.InstagramPost {...block} />],
    [isSoundCloudTrackBlock, block => <blocks.SoundCloudTrack {...block} />],
    [isTikTokVideoBlock, block => <blocks.TikTokVideo {...block} />],
    [isTwitterTweetBlock, block => <blocks.TwitterTweet {...block} />],
    [isVimeoVideoBlock, block => <blocks.VimeoVideo {...block} />],
    [isYouTubeVideoBlock, block => <blocks.YouTubeVideo {...block} />]
  ])

  return (
    embedCond(block) ??
    cond([
      [isTitleBlock, block => <blocks.Title {...block} />],
      [isImageBlock, block => <blocks.Image {...block} />],
      [isImageGalleryBlock, block => <blocks.ImageGallery {...block} />],
      [isQuoteBlock, block => <blocks.Quote {...block} />],
      [isRichTextBlock, block => <blocks.RichText {...block} />],
      [isHtmlBlock, block => <blocks.HTML {...block} />],
      [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />],
      [isTeaserGridBlock, block => <blocks.TeaserGrid {...block} />]
    ])(block)
  )
}

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
