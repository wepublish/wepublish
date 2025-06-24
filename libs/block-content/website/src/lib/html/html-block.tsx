import styled from '@emotion/styled'
import {BuilderHTMLBlockProps} from '@wepublish/website/builder'
import {BlockContent, HtmlBlock as HtmlBlockType} from '@wepublish/website/api'
import InnerHTML from 'dangerously-set-html-content'
import {useReadingList} from '@wepublish/reading-list/website'

export const isHtmlBlock = (block: Pick<BlockContent, '__typename'>): block is HtmlBlockType =>
  block.__typename === 'HTMLBlock'

export const HtmlBlockWrapper = styled('div')``

export const HtmlBlock = ({html, className}: BuilderHTMLBlockProps) => {
  const [readingListProps] = useReadingList()

  return (
    <HtmlBlockWrapper className={className} {...readingListProps}>
      {html && <InnerHTML html={html} />}
    </HtmlBlockWrapper>
  )
}
