import { useApolloClient } from '@apollo/client/react';
import { PollDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { type PollValues, fromPollRows, keepUnsavedRows } from './poll.schema';

export const showMutationError = (error: unknown) => {
  enqueueSnackbar(humanizeError(error as Error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export function usePollId() {
  const { id = '' } = useParams();

  return id;
}

export function useReloadPollRows() {
  const client = useApolloClient();
  const id = usePollId();
  const { getValues, resetField, setValue } = useFormContext<PollValues>();

  return async () => {
    const { data } = await client.query({
      query: PollDocument,
      variables: { id },
      fetchPolicy: 'no-cache',
    });
    const poll = data ? data.poll : null;

    if (!poll) {
      return;
    }

    const saved = fromPollRows(poll);
    const rows = keepUnsavedRows(saved, getValues());

    resetField('answers', { defaultValue: saved.answers });
    resetField('externalVoteSources', {
      defaultValue: saved.externalVoteSources,
    });
    setValue('answers', rows.answers, { shouldDirty: true });
    setValue('externalVoteSources', rows.externalVoteSources, {
      shouldDirty: true,
    });
  };
}
