import {styled} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {Button} from '@wepublish/ui'
import {Comment} from '@wepublish/website/api'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdForum} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'

export const CommentListWrapper = styled('section')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentListActions = styled('div')`
  display: flex;
  justify-content: end;
`

export const CommentListReadMore = styled(Button)`
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
  text-transform: uppercase;
`

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
  openEditorsStateDispatch: dispatch,
  signUpUrl
}: BuilderCommentListProps) => {
  const {
    CommentEditor,
    CommentListItem,
    elements: {Alert}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()
  const canReply = anonymousCanComment || hasUser

  const showReply = getStateForEditor(openEditorsState)('add', null)

  return (
    <CommentListWrapper className={className}>
      {!loading && !error && !data?.comments.length && (
        <Alert severity="info">Keine Kommentare vorhanden.</Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.comments?.map((comment, index) => (
        <CommentListItem
          key={comment.id}
          {...comment}
          ratingSystem={data.ratingSystem}
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
          signUpUrl={signUpUrl}
          commentDepth={0}
          maxCommentDepth={0}
        />
      ))}

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
          canReply={canReply}
          signUpUrl={signUpUrl}
          anonymousCanComment={anonymousCanComment}
        />
      )}

      {canReply && (
        <CommentListActions>
          <CommentListReadMore
            startIcon={<MdForum />}
            variant="contained"
            onClick={() => {
              dispatch({
                type: 'add',
                action: 'open',
                commentId: null
              })
            }}>
            Jetzt Mitreden
          </CommentListReadMore>
        </CommentListActions>
      )}
    </CommentListWrapper>
  )
}
