import { useMutation } from '@apollo/client/react';
import { Button } from '@mui/material';
import { CreatePollDocument } from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';

export function CreatePollBtn() {
  const [createPollMutation, { data: newPoll, loading }] =
    useMutation(CreatePollDocument);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onErrorToast = (error: Error) => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  /**
   * Forward user to new created poll
   */
  useEffect(() => {
    if (newPoll?.createPoll?.id) {
      navigate(`/polls/edit/${newPoll.createPoll.id}`);
    }
  }, [newPoll]);

  async function createPoll() {
    await createPollMutation({
      variables: {
        opensAt: new Date().toISOString(),
      },
      onError: onErrorToast,
    });
  }

  return (
    <Button
      variant="contained"
      onClick={createPoll}
      loading={loading}
      startIcon={<MdAdd />}
    >
      {t('pollList.createNew')}
    </Button>
  );
}
