import {
  FlexAlignment,
  HtmlBlock,
  ImageBlock,
  QuoteBlock,
  RichTextBlock,
  TeaserGridFlexBlock,
  TitleBlock,
  Teaser
} from '@wepublish/website/api'

export type BuilderTitleBlockProps = TitleBlock & {className?: string}
export type BuilderImageBlockProps = ImageBlock & {className?: string}
export type BuilderQuoteBlockProps = QuoteBlock & {className?: string}
export type BuilderRichTextBlockProps = RichTextBlock & {className?: string}
export type BuilderHTMLBlockProps = HtmlBlock & {className?: string}
export type BuilderTeaserGridFlexBlockProps = TeaserGridFlexBlock & {
  className?: string
  showLead?: boolean
}

export type BuilderTeaserProps = {
  teaser?: Teaser | null
  alignment: FlexAlignment
  showLead?: boolean
} & {className?: string}
