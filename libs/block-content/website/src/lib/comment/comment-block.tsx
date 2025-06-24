import styled from '@emotion/styled'
import {useReadingList} from '@wepublish/reading-list/website'
import {BlockContent, CommentBlock as CommentBlockType} from '@wepublish/website/api'
import {BuilderCommentBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isCommentBlock = (
  block: Pick<BlockContent, '__typename'>
): block is CommentBlockType => block.__typename === 'CommentBlock'

export const CommentBlockWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentBlockActions = styled('div')``

export const CommentBlock = ({className, comments}: BuilderCommentBlockProps) => {
  const {Comment: BuilderComment} = useWebsiteBuilder()
  const [readingListProps] = useReadingList()

  return (
    <CommentBlockWrapper className={className} {...readingListProps}>
      {comments?.map(({children, ...comment}) => (
        <BuilderComment key={comment.id} includeAnchor={false} {...comment} />
      ))}
    </CommentBlockWrapper>
  )
}
