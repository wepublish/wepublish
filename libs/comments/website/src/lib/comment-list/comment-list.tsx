import {styled} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {Button} from '@wepublish/ui'
import {Comment} from '@wepublish/website/api'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdForum} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'

export const CommentListWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentListActions = styled('div')``

export const CommentList = ({
  data,
  loading,
  error,
  challenge,
  className,
  maxCommentLength,
  anonymousCanComment,
  anonymousCanRate,
  userCanEdit,
  add,
  onAddComment,
  edit,
  onEditComment,
  openEditorsState,
  openEditorsStateDispatch: dispatch
}: BuilderCommentListProps) => {
  const {
    CommentEditor,
    CommentListItem,
    elements: {Alert}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()

  const showReply = getStateForEditor(openEditorsState)('add', null)
  const canReply = anonymousCanComment || hasUser

  return (
    <CommentListWrapper className={className}>
      {!loading && !error && !data?.comments.length && (
        <Alert severity="info">Keine Kommentare vorhanden.</Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {canReply && (
        <CommentListActions>
          <Button
            startIcon={<MdForum />}
            variant="text"
            onClick={() => {
              dispatch({
                type: 'add',
                action: 'open',
                commentId: null
              })
            }}>
            Jetzt Mitreden
          </Button>
        </CommentListActions>
      )}

      {showReply && (
        <CommentEditor
          challenge={challenge}
          maxCommentLength={maxCommentLength}
          onCancel={() =>
            dispatch({
              type: 'add',
              action: 'close',
              commentId: null
            })
          }
          onSubmit={onAddComment}
          error={add.error}
          loading={add.loading}
        />
      )}

      {data?.comments?.map(comment => (
        <CommentListItem
          key={comment.id}
          {...comment}
          openEditorsState={openEditorsState}
          openEditorsStateDispatch={dispatch}
          challenge={challenge}
          add={add}
          onAddComment={onAddComment}
          edit={edit}
          onEditComment={onEditComment}
          anonymousCanComment={anonymousCanComment}
          anonymousCanRate={anonymousCanRate}
          userCanEdit={userCanEdit}
          maxCommentLength={maxCommentLength}
          children={(comment.children as Comment[]) ?? []}
        />
      ))}
    </CommentListWrapper>
  )
}
