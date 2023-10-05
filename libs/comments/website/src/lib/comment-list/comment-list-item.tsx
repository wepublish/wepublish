import {styled} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {CommentState} from '@wepublish/website/api'
import {BuilderCommentListItemProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {cond} from 'ramda'
import {MdEdit, MdReply} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'

export const CommentListItemWrapper = styled('article')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
`

export const CommentListItemChildren = styled('aside')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  border-left: 2px solid currentColor;
  padding: ${({theme}) => theme.spacing(3)};
  padding-right: 0;
`

export const CommentListItemActions = styled('div')`
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const CommentListItem = ({
  id,
  className,
  text,
  authorType,
  user,
  guestUserImage,
  guestUsername,
  title,
  source,
  state,
  children,
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
  openEditorsStateDispatch: dispatch
}: BuilderCommentListItemProps) => {
  const {
    CommentEditor,
    CommentListItem: BuilderCommentListItem,
    CommentListSingleComment: BuilderCommentListSingleComment,
    elements: {Button}
  } = useWebsiteBuilder()

  const {hasUser: hasLoggedInUser, user: loggedInUser} = useUser()

  const canEdit =
    hasLoggedInUser &&
    loggedInUser?.id === user?.id &&
    (userCanEdit || state === CommentState.PendingUserChanges)
  const canReply = anonymousCanComment || hasLoggedInUser
  const hasActions = canEdit || canReply

  const showReply = getStateForEditor(openEditorsState)('add', id)
  const showEdit = getStateForEditor(openEditorsState)('edit', id)

  return (
    <CommentListItemWrapper className={className}>
      <BuilderCommentListSingleComment
        id={id}
        showContent={!showEdit}
        authorType={authorType}
        guestUserImage={guestUserImage}
        guestUsername={guestUsername}
        source={source}
        title={title}
        text={text}
        user={user}
        className={className}
      />

      <CommentListSingleCommentStateWarnings state={state} />

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

      {hasActions && (
        <CommentListItemActions>
          {canReply && (
            <Button
              startIcon={<MdReply />}
              variant="text"
              size="small"
              onClick={() =>
                dispatch({
                  type: 'add',
                  action: 'open',
                  commentId: id
                })
              }>
              Antworten
            </Button>
          )}

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
        </CommentListItemActions>
      )}

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
            <BuilderCommentListItem
              key={child.id}
              {...child}
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
    </CommentListItemWrapper>
  )
}

const CommentListSingleCommentStateWarnings = (
  props: Pick<BuilderCommentListItemProps, 'state'>
) => {
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
    ]
  ])(props)
}
