import {styled} from '@mui/material'
import {BuilderPageProps} from '@wepublish/website-builder'
import {Block as BlockType} from '@wepublish/website/api'
import {HtmlBlock, isHtmlBlock} from './html-block'
import {ImageBlock, isImageBlock} from './image-block'
import {isQuoteBlock, QuoteBlock} from './quote-block'
import {isRichTextBlock, RichTextBlock} from './richtext-block'
import {isTeaserGridFlexBlock, TeaserGridFlexBlock} from './teaser-grid-flex-block'
import {isTitleBlock, TitleBlock} from './title-block'

export type PageProps = BuilderPageProps

export type BlockProp = {
  block: BlockType
}

export const Block = ({block}: BlockProp) => {
  if (isTitleBlock(block)) {
    return <TitleBlock {...block} />
  }

  if (isImageBlock(block)) {
    return <ImageBlock {...block} />
  }

  if (isQuoteBlock(block)) {
    return <QuoteBlock {...block} />
  }

  if (isRichTextBlock(block)) {
    return <RichTextBlock {...block} />
  }

  if (isHtmlBlock(block)) {
    return <HtmlBlock {...block} />
  }

  if (isTeaserGridFlexBlock(block)) {
    return <TeaserGridFlexBlock {...block} />
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
