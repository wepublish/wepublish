import {
  CommentItemType,
  CommentSort,
  CommentState,
  FullCommentFragment,
  useCommentListLazyQuery,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { FlexboxGrid } from 'rsuite';

import { CommentPreview, RevisionProps } from './commentPreview';
import { CreateCommentBtn } from './createCommentBtn';

interface ChildCommentsProps extends RevisionProps {
  comments?: FullCommentFragment[];
  comment: FullCommentFragment;
  originComment?: FullCommentFragment;
}

function ChildComments({
  comments,
  comment,
  originComment,
  revision,
  setRevision,
}: ChildCommentsProps): JSX.Element {
  if (!comments) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }
  const childComments = comments.filter(
    tmpComment => tmpComment.parentComment?.id === comment.id
  );
  return (
    <div
      style={{
        marginTop: '20px',
        borderLeft: '1px lightgrey solid',
        paddingLeft: '20px',
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
            revision={revision}
            setRevision={setRevision}
          />
          {/* some fancy recursion */}
          <ChildComments
            comments={comments}
            comment={childComment}
            originComment={originComment}
            revision={revision}
            setRevision={setRevision}
          />
        </div>
      ))}
    </div>
  );
}

interface CommentHistoryProps extends RevisionProps {
  commentItemType: CommentItemType;
  commentItemID: string;
  originComment?: FullCommentFragment;
}

export function CommentHistory({
  commentItemType,
  commentItemID,
  revision,
  setRevision,
  originComment,
}: CommentHistoryProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<FullCommentFragment[] | undefined>();
  const [fetchCommentList, { data }] = useCommentListLazyQuery({
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
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    setComments(data?.comments?.nodes);
  }, [data]);

  // re-load comments whenever the comment id changes
  useEffect(() => {
    fetchCommentList();
  }, [originComment?.id]);

  return (
    <>
      <FlexboxGrid
        align="bottom"
        justify="end"
      >
        <FlexboxGrid.Item
          style={{ textAlign: 'end', paddingBottom: '20px' }}
          colspan={24}
        >
          <CreateCommentBtn
            itemID={commentItemID}
            itemType={commentItemType}
            text={t('commentHistory.addComment')}
            color="green"
            appearance="ghost"
            icon={<MdAdd />}
            onCommentCreated={async () => {
              await fetchCommentList();
            }}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>

      {comments &&
        comments.map(tmpComment => (
          <div key={tmpComment.id}>
            {!tmpComment.parentComment && (
              <>
                <CommentPreview
                  comment={tmpComment}
                  originComment={originComment}
                  revision={revision}
                  setRevision={setRevision}
                />
                <ChildComments
                  comment={tmpComment}
                  originComment={originComment}
                  comments={comments}
                  revision={revision}
                  setRevision={setRevision}
                />
              </>
            )}
          </div>
        ))}
    </>
  );
}
