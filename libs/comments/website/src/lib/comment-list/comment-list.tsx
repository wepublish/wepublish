import styled from '@emotion/styled';
import { Button } from '@wepublish/ui';
import {
  BuilderCommentListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MdForum } from 'react-icons/md';
import { getStateForEditor } from './comment-list.state';

export const CommentListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
`;

export const CommentListActions = styled('div')`
  display: flex;
  justify-content: end;
`;

export const CommentListReadMore = styled(Button)`
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
  text-transform: uppercase;
`;

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
  signUpUrl,
  maxCommentDepth,
}: BuilderCommentListProps) => {
  const {
    CommentEditor,
    CommentListItem,
    elements: { Alert },
  } = useWebsiteBuilder();
  const canReply = true;
  const showReply = getStateForEditor(openEditorsState)('add', null);

  return (
    <CommentListWrapper className={className}>
      {!loading && !error && !data?.commentsForItem.length && (
        <Alert severity="info">Keine Kommentare vorhanden.</Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.commentsForItem?.map((comment, index) => (
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
          children={comment.children ?? []}
          signUpUrl={signUpUrl}
          maxCommentDepth={maxCommentDepth}
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
              commentId: null,
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
                commentId: null,
              });
            }}
          >
            Jetzt Mitreden
          </CommentListReadMore>
        </CommentListActions>
      )}
    </CommentListWrapper>
  );
};
