import { useMutation } from '@apollo/client/react';
import { PollDocument, UpdatePollDocument } from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { CanGetPoll, CanUpdatePoll } from '@wepublish/permissions';
import { PermissionControl } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

import {
  fromPoll,
  pollTitleParams,
  toUpdatePollVariables,
} from './poll.schema';
import { pollView } from './poll.view';

const VIEW_PERMISSIONS = [CanGetPoll.id, CanUpdatePoll.id];

type PollEditFormProps = {
  id: string;
};

export const PollEditForm = ({ id }: PollEditFormProps) => {
  const load = useQueryLoader(PollDocument, { id }, data =>
    fromPoll(data.poll)
  );
  const [updatePoll] = useMutation(UpdatePollDocument);
  const poll = useEditForm(pollView, {
    title: 'pollEditView.title',
    titleParams: pollTitleParams,
    load,
    save: values =>
      updatePoll({ variables: toUpdatePollVariables(id, values) }),
  });

  return <FormPage controller={poll} />;
};

export const PollEditView = () => {
  const { id = '' } = useParams();

  return (
    <PermissionControl
      qualifyingPermissions={VIEW_PERMISSIONS}
      showRejectionMessage
    >
      <PollEditForm
        key={id}
        id={id}
      />
    </PermissionControl>
  );
};
