import {BuilderBlockRendererProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html-block'
import {isImageBlock} from './image-block'
import {isQuoteBlock} from './quote-block'
import {isRichTextBlock} from './richtext-block'
import {isTeaserGridFlexBlock} from './teaser-grid-flex-block'
import {isTitleBlock} from './title-block'
import {cond} from 'ramda'

export const BlockRenderer = ({block}: BuilderBlockRendererProps) => {
  const {blocks} = useWebsiteBuilder()

  return cond([
    [isTitleBlock, block => <blocks.Title {...block} />],
    [isImageBlock, block => <blocks.Image {...block} />],
    [isQuoteBlock, block => <blocks.Quote {...block} />],
    [isRichTextBlock, block => <blocks.RichText {...block} />],
    [isHtmlBlock, block => <blocks.HTML {...block} />],
    [isTeaserGridFlexBlock, block => <blocks.TeaserGridFlex {...block} />]
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