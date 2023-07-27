import {BuilderBlockRendererProps, EmbedType, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html-block'
import {
  isEmbedBlock,
  isBildwurfAdBlock,
  isFacebookPostBlock,
  isFacebookVideoBlock,
  isInstagramBlock,
  isSoundCloudTrackBlock,
  isTikTokVideoBlock,
  isTwitterTweetBlock,
  isVimeoVideoBlock,
  isYouTubeVideoBlock
} from './embed-block'
import {isImageBlock} from './image-block'
import {isQuoteBlock} from './quote-block'
import {isRichTextBlock} from './richtext-block'
import {isTeaserGridFlexBlock} from './teaser-grid-flex-block'
import {isTitleBlock} from './title-block'
import {cond} from 'ramda'
import {isTeaserGridBlock} from './teaser-grid-block'
import {isImageGalleryBlock} from './image-gallery-block'

export const BlockRenderer = ({block}: BuilderBlockRendererProps) => {
  const {blocks} = useWebsiteBuilder()

  return cond([
    [isTitleBlock, block => <blocks.Title {...block} />],
    [isImageBlock, block => <blocks.Image {...block} />],
    [isImageGalleryBlock, block => <blocks.ImageGallery {...block} />],
    [isQuoteBlock, block => <blocks.Quote {...block} />],
    [isRichTextBlock, block => <blocks.RichText {...block} />],
    [isHtmlBlock, block => <blocks.HTML {...block} />],
    [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />],
    [isTeaserGridBlock, block => <blocks.TeaserGrid {...block} />],
    [isEmbedBlock, block => <blocks.Embed type={EmbedType.Other} {...block} />],
    [isBildwurfAdBlock, block => <blocks.Embed type={EmbedType.BildwurfAd} {...block} />],
    [isFacebookPostBlock, block => <blocks.Embed type={EmbedType.FacebookPost} {...block} />],
    [isFacebookVideoBlock, block => <blocks.Embed type={EmbedType.FacebookVideo} {...block} />],
    [isInstagramBlock, block => <blocks.Embed type={EmbedType.InstagramPost} {...block} />],
    [isSoundCloudTrackBlock, block => <blocks.Embed type={EmbedType.SoundCloudTrack} {...block} />],
    [isTikTokVideoBlock, block => <blocks.Embed type={EmbedType.TikTokVideo} {...block} />],
    [isTwitterTweetBlock, block => <blocks.Embed type={EmbedType.TwitterTweet} {...block} />],
    [isVimeoVideoBlock, block => <blocks.Embed type={EmbedType.VimeoVideo} {...block} />],
    [isYouTubeVideoBlock, block => <blocks.Embed type={EmbedType.YouTubeVideo} {...block} />]
  ])(block)
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
