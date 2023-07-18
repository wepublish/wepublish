import {
  Block,
  FlexAlignment,
  HtmlBlock,
  ImageBlock,
  ImageGalleryBlock,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  Teaser,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TitleBlock
} from '@wepublish/website/api'

export type BuilderBlockRendererProps = {block: Block}
export type BuilderTitleBlockProps = TitleBlock & {className?: string}
export type BuilderImageBlockProps = ImageBlock & {className?: string}
export type BuilderImageGalleryBlockProps = ImageGalleryBlock & {className?: string}
export type BuilderQuoteBlockProps = QuoteBlock & {className?: string}
export type BuilderRichTextBlockProps = RichTextBlock & {className?: string}
export type BuilderHTMLBlockProps = HtmlBlock & {className?: string}
export type BuilderPollBlockProps = PollBlock & {className?: string}
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
