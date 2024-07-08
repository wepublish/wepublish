import {Theme, css, lighten, styled, useTheme} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {CommentState} from '@wepublish/website/api'
import {BuilderCommentListItemProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {cond} from 'ramda'
import {MdEdit, MdReply} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'
import {CommentListItemShare} from './comment-list-item-share'
import {useMemo} from 'react'
import {Button} from '@wepublish/ui'

export const CommentListItemChildren = styled('aside')`
  display: grid;
  position: relative;
  gap: ${({theme}) => theme.spacing(3)};
  padding: ${({theme}) => theme.spacing(3)};
  padding-right: 0;

  &::before {
    content: '';
    position: absolute;
    top: ${({theme}) => theme.spacing(2)};
    bottom: ${({theme}) => theme.spacing(2)};
    left: ${({theme}) => theme.spacing(1)};
    height: 100%;
    width: 2px;
    background-color: currentColor;
  }
`

export const CommentListItemActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: start;
  justify-content: space-between;
`

export const CommentListItemActionsButtons = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
  align-items: start;
  justify-content: space-between;
`

export const CommentReplyButton = styled(Button)(({theme}) => ({
  border: '1px solid',
  '&:hover': {
    border: '1px solid',
    backgroundColor: lighten(theme.palette.primary.main, 0.8)
  }
}))

export const CommentListItem = ({
  anonymousCanComment,
  anonymousCanRate,
  userCanEdit,
  maxCommentLength,
  challenge,
  add,
  onAddComment,
  edit,
  onEditComment,
  openEditorsState,
  openEditorsStateDispatch: dispatch,
  ratingSystem,
  className,
  ...comment
}: BuilderCommentListItemProps) => {
  const {id, text, title, state, children, userRatings, overriddenRatings, calculatedRatings} =
    comment

  const {
    CommentEditor,
    CommentRatings,
    CommentListItemChild,
    Comment,
    elements: {Button}
  } = useWebsiteBuilder()

  const {hasUser: hasLoggedInUser, user: loggedInUser} = useUser()

  const canEdit =
    hasLoggedInUser &&
    loggedInUser?.id === comment.user?.id &&
    (userCanEdit || comment.state === CommentState.PendingUserChanges)
  const canReply = anonymousCanComment || hasLoggedInUser
  const canShare = anonymousCanComment || hasLoggedInUser

  const showReply = getStateForEditor(openEditorsState)('add', id)
  const showEdit = getStateForEditor(openEditorsState)('edit', id)

  return (
    <Comment {...comment} showContent={!showEdit} className={className}>
      <CommentListItemStateWarnings state={state} />

      {showEdit && (
        <CommentEditor
          title={title}
          text={text}
          onCancel={() =>
            dispatch({
              type: 'edit',
              action: 'close',
              commentId: id
            })
          }
          onSubmit={data => onEditComment({...data, id})}
          maxCommentLength={maxCommentLength}
          error={edit.error}
          loading={edit.loading}
        />
      )}

      <CommentListItemActions>
        <CommentListItemActionsButtons>
          {canReply && (
            <CommentReplyButton
              startIcon={<MdReply />}
              variant="outlined"
              size="small"
              onClick={() => {
                dispatch({
                  type: 'add',
                  action: 'open',
                  commentId: id
                })
              }}>
              Antworten
            </CommentReplyButton>
          )}

          {canShare && <CommentListItemShare url={comment.url} title="share" />}

          {canEdit && (
            <Button
              startIcon={<MdEdit />}
              variant="text"
              size="small"
              onClick={() =>
                dispatch({
                  type: 'edit',
                  action: 'open',
                  commentId: id
                })
              }>
              Editieren
            </Button>
          )}
        </CommentListItemActionsButtons>

        <CommentRatings
          commentId={id}
          ratingSystem={ratingSystem}
          userRatings={userRatings}
          overriddenRatings={overriddenRatings}
          calculatedRatings={calculatedRatings}
        />
      </CommentListItemActions>

      {showReply && (
        <CommentEditor
          onCancel={() =>
            dispatch({
              type: 'add',
              action: 'close',
              commentId: id
            })
          }
          onSubmit={data => onAddComment({...data, parentID: id})}
          maxCommentLength={maxCommentLength}
          challenge={challenge}
          error={add.error}
          loading={add.loading}
        />
      )}

      {!!children?.length && (
        <CommentListItemChildren>
          {children.map(child => (
            <CommentListItemChild
              key={child.id}
              {...child}
              ratingSystem={ratingSystem}
              openEditorsState={openEditorsState}
              openEditorsStateDispatch={dispatch}
              add={add}
              onAddComment={onAddComment}
              edit={edit}
              onEditComment={onEditComment}
              challenge={challenge}
              anonymousCanComment={anonymousCanComment}
              anonymousCanRate={anonymousCanRate}
              userCanEdit={userCanEdit}
              maxCommentLength={maxCommentLength}
              className={className}
            />
          ))}
        </CommentListItemChildren>
      )}
    </Comment>
  )
}

const CommentListItemStateWarnings = (props: Pick<BuilderCommentListItemProps, 'state'>) => {
  const {
    elements: {Alert}
  } = useWebsiteBuilder()

  return cond([
    [
      ({state}) => state === CommentState.PendingApproval,
      () => <Alert severity="info">Kommentar wartet auf Freischaltung.</Alert>
    ],
    [
      ({state}) => state === CommentState.PendingUserChanges,
      () => <Alert severity="warning">Kommentar muss editiert werden bevor Freischaltung.</Alert>
    ],
    [
      ({state}) => state === CommentState.Rejected,
      () => <Alert severity="error">Kommentar wurde nicht freigeschalten.</Alert>
    ],
    [({state}: typeof props) => true, (_: typeof props): JSX.Element | null => null]
  ])(props)
}
