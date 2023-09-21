import {styled} from '@mui/material'
import {Block, CommentBlock as CommentBlockType} from '@wepublish/website/api'
import {BuilderCommentBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const isCommentBlock = (block: Block): block is CommentBlockType =>
  block.__typename === 'CommentBlock'

export const CommentBlockWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentBlockActions = styled('div')``

export const CommentBlock = ({className, comments}: BuilderCommentBlockProps) => {
  const {CommentListSingleComment: BuilderCommentListSingleComment} = useWebsiteBuilder()

  return (
    <CommentBlockWrapper className={className}>
      {comments?.map(({children, ...comment}) => (
        <BuilderCommentListSingleComment key={comment.id} {...comment} />
      ))}
    </CommentBlockWrapper>
  )
}
