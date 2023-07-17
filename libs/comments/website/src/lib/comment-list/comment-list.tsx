import {styled} from '@mui/material'
import {Comment} from '@wepublish/website/api'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'

export const CommentListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentList = ({data, className}: BuilderCommentListProps) => {
  const {
    CommentListItem,
    elements: {Alert}
  } = useWebsiteBuilder()

  return (
    <CommentListWrapper className={className}>
      {data?.comments?.map(comment => (
        <CommentListItem
          key={comment.id}
          {...comment}
          children={(comment.children as Comment[]) ?? []}
        />
      ))}

      {!data?.comments.length && <Alert severity="info">Keine Kommentare vorhanden.</Alert>}
    </CommentListWrapper>
  )
}
