import styled from '@emotion/styled'
import {useReadingList} from '@wepublish/reading-list/website'
import {BlockContent, FacebookPostBlock as FacebookPostBlockType} from '@wepublish/website/api'
import {BuilderFacebookPostBlockProps} from '@wepublish/website/builder'

export const isFacebookPostBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FacebookPostBlockType => block.__typename === 'FacebookPostBlock'

export const FacebookPostBlockWrapper = styled('div')``

export function FacebookPostBlock({userID, postID, className}: BuilderFacebookPostBlockProps) {
  const [readingListProps] = useReadingList()

  return (
    <FacebookPostBlockWrapper
      className={className}
      {...readingListProps}></FacebookPostBlockWrapper>
  )
}
