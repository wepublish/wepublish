import {useWebsiteBuilder} from '@wepublish/website/builder'
import {Block as BlockType} from '@wepublish/website/api'
import {isHtmlBlock} from './html-block'
import {isImageBlock} from './image-block'
import {isQuoteBlock} from './quote-block'
import {isRichTextBlock} from './richtext-block'
import {isTeaserGridFlexBlock} from './teaser-grid-flex-block'
import {isTitleBlock} from './title-block'

export type BlockProp = {
  block: BlockType
}

export const Block = ({block}: BlockProp) => {
  const {blocks} = useWebsiteBuilder()

  if (isTitleBlock(block)) {
    return <blocks.Title {...block} />
  }

  if (isImageBlock(block)) {
    return <blocks.Image {...block} />
  }

  if (isQuoteBlock(block)) {
    return <blocks.Quote {...block} />
  }

  if (isRichTextBlock(block)) {
    return <blocks.RichText {...block} />
  }

  if (isHtmlBlock(block)) {
    return <blocks.HTML {...block} />
  }

  if (isTeaserGridFlexBlock(block)) {
    return <blocks.TeaserGridFlex {...block} />
  }

  return null
}

export type BlocksProp = {
  blocks: BlockType[]
}

export const Blocks = ({blocks}: BlocksProp) => (
  <>
    {blocks.map((block, index) => (
      <Block key={index} block={block} />
    ))}
  </>
)
