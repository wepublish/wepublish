import {styled} from '@mui/material'
import {BuilderCommentBlockProps, useWebsiteBuilder} from '@wepublish/website/builder'

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
