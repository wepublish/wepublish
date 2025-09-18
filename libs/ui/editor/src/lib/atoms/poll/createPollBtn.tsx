import { ApolloError } from '@apollo/client';
import { useCreatePollMutation } from '@wepublish/editor/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { IconButton, Message, toaster } from 'rsuite';

export function CreatePollBtn() {
  const [createPollMutation, { data: newPoll, loading }] =
    useCreatePollMutation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onErrorToast = (error: ApolloError) => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
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
      onError: onErrorToast,
    });
  }

  return (
    <IconButton
      appearance="primary"
      onClick={createPoll}
      loading={loading}
    >
      <MdAdd />
      {t('pollList.createNew')}
    </IconButton>
  );
}
