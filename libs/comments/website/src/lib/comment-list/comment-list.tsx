import {styled} from '@mui/material'
import {Comment} from '@wepublish/website/api'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const CommentListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentList = ({data, error, loading, className}: BuilderCommentListProps) => {
  const {
    CommentListItem,
    elements: {Alert}
  } = useWebsiteBuilder()
  const noComments = !error && !loading && !data?.comments.length

  return (
    <CommentListWrapper className={className}>
      {data?.comments?.map(comment => (
        <CommentListItem
          key={comment.id}
          {...comment}
          children={(comment.children as Comment[]) ?? []}
        />
      ))}

      {noComments && <Alert severity="info">Keine Kommentare vorhanden.</Alert>}
    </CommentListWrapper>
  )
}
