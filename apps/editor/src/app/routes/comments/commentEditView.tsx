import { useMutation } from '@apollo/client/react';
import {
  type FullCommentFragment,
  CommentDocument,
  RatingSystemDocument,
  UpdateCommentDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import {
  CanTakeActionOnComment,
  CanUpdateComments,
} from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { fromComment, toUpdateCommentVariables } from './comment.schema';
import { commentView } from './comment.view';

const commentPermissions = [CanUpdateComments.id, CanTakeActionOnComment.id];

type CommentEditFormProps = {
  id: string;
};

export function CommentEditForm({ id }: CommentEditFormProps) {
  const [loaded, setLoaded] = useState<FullCommentFragment | null>(null);
  const loadComment = useQueryLoader(
    CommentDocument,
    { id },
    data => data.comment
  );
  const loadAnswers = useQueryLoader(
    RatingSystemDocument,
    {},
    data => data.ratingSystem.answers
  );
  const [updateComment] = useMutation(UpdateCommentDocument);
  const comment = useEditForm(commentView, {
    title: 'comments.edit.title',
    load: async () => {
      const [record, answers] = await Promise.all([
        loadComment(),
        loadAnswers(),
      ]);

      setLoaded(record);

      return fromComment(record, answers);
    },
    save: async (values, { changedKeys }) => {
      if (!loaded) {
        throw new Error('');
      }

      await updateComment({
        variables: toUpdateCommentVariables(loaded, values, changedKeys),
      });
    },
  });

  return <FormPage controller={comment} />;
}

export function CommentEditView() {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={commentPermissions}
      showRejectionMessage
    >
      <CommentEditForm
        key={id}
        id={id}
      />
    </PermissionControl>
  );
}
