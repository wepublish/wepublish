import {styled} from '@mui/material'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const CommentListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
  justify-items: center;
`

export const CommentList = ({data, className}: BuilderCommentListProps) => {
  const {CommentListItem} = useWebsiteBuilder()

  return (
    <CommentListWrapper className={className}>
      {data?.comments?.map(comment => (
        <CommentListItem key={comment.id} {...comment} />
      ))}
    </CommentListWrapper>
  )
}
