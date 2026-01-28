import { ApolloError, ApolloQueryResult } from '@apollo/client';
import {
  Event,
  EventListQuery,
  getApiClientV2,
  useDeleteEventMutation,
} from '@wepublish/editor/api-v2';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

type DeleteEventProps = {
  event: Event | undefined;
  onClose(): void;
  onDelete(): Promise<ApolloQueryResult<EventListQuery>>;
};

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
      {t('toast.deletedSuccess')}
    </Message>
  );
};

export function DeleteEventModal({
  event,
  onClose,
  onDelete,
}: DeleteEventProps) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const [deleteEventMutation] = useDeleteEventMutation({ client });

  async function deleteEvent() {
    if (!event) {
      return;
    }

    await deleteEventMutation({
      variables: {
        id: event.id,
      },
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    });

    onClose();
    onDelete();
  }

  return (
    <Modal
      open={!!event}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('event.delete.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('event.delete.body', {
          name: event?.name,
        })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={deleteEvent}
          appearance="primary"
          color="red"
        >
          {t('event.delete.delete')}
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
