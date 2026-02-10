import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import {
  buttonStyles,
  CommentHeader,
  CommentListItemActions,
  CommentListItemActionsButtons,
  CommentListItemChildren,
  CommentListItemShare,
  CommentListItemStateWarnings,
  getStateForEditor,
} from '@wepublish/comments/website';
import { CommentState } from '@wepublish/website/api';
import {
  BuilderCommentListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdEdit, MdReply } from 'react-icons/md';

const OnlineReportsCommentListItemBase = ({
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
  signUpUrl,
  commentDepth = 0,
  maxCommentDepth,
  ...comment
}: BuilderCommentListItemProps) => {
  const {
    id,
    text,
    title,
    state,
    children,
    userRatings,
    overriddenRatings,
    calculatedRatings,
  } = comment;

  const {
    CommentEditor,
    CommentRatings,
    CommentListItemChild,
    Comment,
    elements: { Button },
  } = useWebsiteBuilder();

  const { hasUser: hasLoggedInUser, user: loggedInUser } = useUser();

  const canEdit =
    hasLoggedInUser &&
    loggedInUser?.id === comment.user?.id &&
    (userCanEdit || comment.state === CommentState.PendingUserChanges);
  const maxDepthHit =
    maxCommentDepth != null && commentDepth >= maxCommentDepth;
  const canReply = !maxDepthHit;

  const showReply = getStateForEditor(openEditorsState)('add', id);
  const showEdit = getStateForEditor(openEditorsState)('edit', id);

  return (
    <Comment
      {...comment}
      showContent={!showEdit}
      className={className}
    >
      <CommentListItemStateWarnings state={state} />
      {showEdit && (
        <CommentEditor
          title={title}
          text={text}
          onCancel={() =>
            dispatch({
              type: 'edit',
              action: 'close',
              commentId: id,
            })
          }
          onSubmit={data => onEditComment({ ...data, id })}
          maxCommentLength={maxCommentLength}
          error={edit.error}
          loading={edit.loading}
          canReply={canReply}
          parentUrl={comment.url}
          signUpUrl={signUpUrl}
        />
      )}
      <CommentListItemActions>
        <CommentRatings
          commentId={id}
          ratingSystem={ratingSystem}
          userRatings={userRatings}
          overriddenRatings={overriddenRatings}
          calculatedRatings={calculatedRatings}
        />

        <CommentListItemActionsButtons>
          <CommentListItemShare
            url={comment.url}
            title="share"
            forceNonSystemShare={true}
          />

          {canEdit && (
            <Button
              startIcon={<MdEdit />}
              variant="text"
              size="small"
              onClick={() =>
                dispatch({
                  type: 'edit',
                  action: 'open',
                  commentId: id,
                })
              }
            >
              Editieren
            </Button>
          )}

          {canReply && (
            <Button
              startIcon={<MdReply />}
              variant="outlined"
              size="small"
              css={buttonStyles}
              onClick={() => {
                dispatch({
                  type: 'add',
                  action: 'open',
                  commentId: id,
                });
              }}
            >
              Antworten
            </Button>
          )}
        </CommentListItemActionsButtons>
      </CommentListItemActions>
      {showReply && (
        <CommentEditor
          onCancel={() =>
            dispatch({
              type: 'add',
              action: 'close',
              commentId: id,
            })
          }
          onSubmit={data => onAddComment({ ...data, parentID: id })}
          maxCommentLength={maxCommentLength}
          challenge={challenge}
          error={add.error}
          loading={add.loading}
          canReply={canReply}
          parentUrl={comment.url}
          signUpUrl={signUpUrl}
          anonymousCanComment={anonymousCanComment}
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
              signUpUrl={signUpUrl}
              commentDepth={commentDepth + 1}
              maxCommentDepth={maxCommentDepth}
            />
          ))}
        </CommentListItemChildren>
      )}
    </Comment>
  );
};

export const OnlineReportsCommentListItem = styled(
  OnlineReportsCommentListItemBase
)`
  ${CommentHeader} {
    & div {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: calc(100vw - ${({ theme }) => theme.spacing(5)} - 62px);
    }
  }
`;
