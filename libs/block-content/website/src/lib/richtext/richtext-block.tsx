import styled from '@emotion/styled'
import {BuilderRichTextBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {BlockContent, RichTextBlock as RichTextBlockType} from '@wepublish/website/api'
import {useReadingList} from '@wepublish/reading-list/website'

export const isRichTextBlock = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType => block.__typename === 'RichTextBlock'

export const RichTextBlockWrapper = styled('div')`
  position: relative;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`

export const RichTextBlock = ({className, richText}: BuilderRichTextBlockProps) => {
  const {
    richtext: {RenderRichtext}
  } = useWebsiteBuilder()
  const [readingListProps] = useReadingList()

  return (
    <RichTextBlockWrapper className={className} {...readingListProps}>
      <RenderRichtext elements={richText ?? []} />
    </RichTextBlockWrapper>
  )
}
