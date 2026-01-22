import { ApolloError, ApolloQueryResult } from '@apollo/client';
import {
  getApiClientV2,
  Poll,
  PollsQuery,
  useDeletePollMutation,
} from '@wepublish/editor/api-v2';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

interface DeletePollProps {
  poll?: Poll;
  onClose(): void;
  onDelete(): Promise<ApolloQueryResult<PollsQuery>>;
}

/**
 * Error handling
 */
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

const onCompletedToast = (t: TFunction) => () => {
  toaster.push(
    <Message
      type="success"
      showIcon
      closable
      duration={3000}
    >
      {t('pollList.pollDeleted')}
    </Message>
  );
};

export function DeletePollModal({ poll, onClose, onDelete }: DeletePollProps) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const [deletePollMutation] = useDeletePollMutation({ client });

  /**
   * FUNCTIONS
   */
  async function deletePoll() {
    if (!poll) {
      return;
    }

    // call api
    await deletePollMutation({
      variables: {
        deletePollId: poll.id,
      },
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    });

    onClose();
    onDelete();
  }

  return (
    <Modal
      open={!!poll}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('deletePollModal.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('deletePollModal.body', {
          pollQuestion: poll?.question || t('pollList.noQuestion'),
        })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={deletePoll}
          appearance="primary"
          color="red"
        >
          {t('deletePollModal.deleteBtn')}
        </Button>

        <Button
          onClick={onClose}
          appearance="subtle"
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
