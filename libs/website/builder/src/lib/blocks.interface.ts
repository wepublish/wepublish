import {
  FlexAlignment,
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  Teaser,
  Block,
  TeaserGridBlock
} from '@wepublish/website/api'

export type BuilderBlockRendererProps = {block: Block}
export type BuilderTitleBlockProps = TitleBlock & {className?: string}
export type BuilderImageBlockProps = ImageBlock & {className?: string}
export type BuilderQuoteBlockProps = QuoteBlock & {className?: string}
export type BuilderRichTextBlockProps = RichTextBlock & {className?: string}
export type BuilderHTMLBlockProps = HtmlBlock & {className?: string}
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string
  showLead?: boolean
}
export type BuilderTeaserGridBlockProps = TeaserGridBlock & {
  className?: string
  showLead?: boolean
}

export type BuilderTeaserProps = {
  teaser?: Teaser | null
  alignment: FlexAlignment
  showLead?: boolean
} & {className?: string}
