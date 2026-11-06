import { useQuery } from '@apollo/client/react';
import { Box, Grid } from '@mui/material';
import {
  CommentItemType,
  CommentListDocument,
  CommentSort,
  CommentState,
  FullCommentFragment,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';

import { CommentPreview } from './commentPreview';
import { CreateCommentBtn } from './createCommentBtn';

interface ChildCommentsProps {
  comments?: FullCommentFragment[];
  comment: FullCommentFragment;
  originComment?: FullCommentFragment;
}

function ChildComments({
  comments,
  comment,
  originComment,
}: ChildCommentsProps) {
  if (!comments) {
    return null;
  }

  const childComments = comments.filter(
    tmpComment => tmpComment.parentComment?.id === comment.id
  );

  return (
    <Box
      sx={{
        marginTop: 2.5,
        borderLeft: '1px solid',
        borderLeftColor: 'divider',
        paddingLeft: 2.5,
      }}
    >
      {childComments.map(childComment => (
        <div
          key={childComment.id}
          id={
            childComment.id === originComment?.id ?
              `comment-${originComment.id}`
            : ''
          }
        >
          <CommentPreview
            comment={childComment}
            originComment={
              childComment.id === originComment?.id ? originComment : undefined
            }
          />
          {/* some fancy recursion */}
          <ChildComments
            comments={comments}
            comment={childComment}
            originComment={originComment}
          />
        </div>
      ))}
    </Box>
  );
}

interface CommentHistoryProps {
  commentItemType: CommentItemType;
  commentItemID: string;
  originComment?: FullCommentFragment;
}

export function CommentHistory({
  commentItemType,
  commentItemID,
  originComment,
}: CommentHistoryProps) {
  const { t } = useTranslation();
  const { data, refetch } = useQuery(CommentListDocument, {
    variables: {
      filter: {
        itemType: commentItemType,
        itemID: commentItemID,
        states: [
          CommentState.Approved,
          CommentState.PendingUserChanges,
          CommentState.PendingApproval,
          CommentState.Rejected,
        ],
      },
      sort: CommentSort.CreatedAt,
      take: 1000,
    },
  });

  const comments = data?.comments?.nodes;

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}
      >
        <Grid
          size={{ xs: 12 }}
          container
          spacing={2}
          style={{ textAlign: 'end', paddingBottom: '20px' }}
        >
          <CreateCommentBtn
            itemID={commentItemID}
            itemType={commentItemType}
            text={t('commentHistory.addComment')}
            color="success"
            variant="outlined"
            icon={<MdAdd />}
            onCommentCreated={async () => {
              await refetch();
            }}
          />
        </Grid>
      </Grid>

      {comments &&
        comments.map(tmpComment => (
          <div key={tmpComment.id}>
            {!tmpComment.parentComment && (
              <>
                <CommentPreview
                  comment={tmpComment}
                  originComment={originComment}
                />
                <ChildComments
                  comment={tmpComment}
                  originComment={originComment}
                  comments={comments}
                />
              </>
            )}
          </div>
        ))}
    </>
  );
}
