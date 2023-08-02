import {BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html/html-block'
import {isImageBlock} from './image/image-block'
import {isQuoteBlock} from './quote/quote-block'
import {isRichTextBlock} from './richtext/richtext-block'
import {isTeaserGridFlexBlock} from './teaser/teaser-grid-flex-block'
import {isTitleBlock} from './title/title-block'
import {cond} from 'ramda'
import {isTeaserGridBlock} from './teaser/teaser-grid-block'
import {isImageGalleryBlock} from './image-gallery/image-gallery-block'
import {isPollBlock} from './poll/poll-block'
import {isListicleBlock} from './listicle/listicle-block'
import {isEventBlock} from './event/event-block'

export const BlockRenderer = ({block}: BuilderBlockRendererProps) => {
  const {blocks} = useWebsiteBuilder()

  const teaserCond = cond([
    [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />],
    [isTeaserGridBlock, block => <blocks.TeaserGrid {...block} />]
  ])

  const imageCond = cond([
    [isImageBlock, block => <blocks.Image {...block} />],
    [isImageGalleryBlock, block => <blocks.ImageGallery {...block} />]
  ])

  return (
    teaserCond(block) ??
    imageCond(block) ??
    cond([
      [isTitleBlock, block => <blocks.Title {...block} />],
      [isQuoteBlock, block => <blocks.Quote {...block} />],
      [isRichTextBlock, block => <blocks.RichText {...block} />],
      [isHtmlBlock, block => <blocks.HTML {...block} />],
      [isEventBlock, block => <blocks.Event {...block} />],
      [isPollBlock, block => <blocks.Poll {...block} />],
      [isListicleBlock, block => <blocks.Listicle {...block} />]
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
