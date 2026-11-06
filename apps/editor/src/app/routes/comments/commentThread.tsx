import { useQuery } from '@apollo/client/react';
import { CommentDocument } from '@wepublish/editor/api';
import { CommentHistory } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

export function CommentThread() {
  const { id = '' } = useParams();
  const { data } = useQuery(CommentDocument, { variables: { id } });

  if (data === undefined) {
    return null;
  }

  return (
    <CommentHistory
      commentItemID={data.comment.itemID}
      commentItemType={data.comment.itemType}
      originComment={data.comment}
    />
  );
}
