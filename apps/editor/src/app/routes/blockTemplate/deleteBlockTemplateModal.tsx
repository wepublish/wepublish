import { useMutation } from '@apollo/client/react';
import {
  BlockTemplate,
  DeleteBlockTemplateDocument,
} from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

type DeleteBlockTemplateModalProps = {
  blockTemplate: BlockTemplate | undefined;
  onClose(): void;
  onDelete(): Promise<unknown>;
};

const onErrorToast = (error: Error) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
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

export function DeleteBlockTemplateModal({
  blockTemplate,
  onClose,
  onDelete,
}: DeleteBlockTemplateModalProps) {
  const { t } = useTranslation();

  const [deleteBlockTemplateMutation] = useMutation(
    DeleteBlockTemplateDocument,
    {
      onError: onErrorToast,
      onCompleted: onCompletedToast(t),
    }
  );

  async function deleteBlockTemplate() {
    if (!blockTemplate) {
      return;
    }

    await deleteBlockTemplateMutation({
      variables: {
        id: blockTemplate.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Modal
      open={!!blockTemplate}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('deleteBlockTemplateModal.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('deleteBlockTemplateModal.body', {
          name: blockTemplate?.name,
        })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={deleteBlockTemplate}
          appearance="primary"
          color="red"
        >
          {t('deleteBlockTemplateModal.deleteBtn')}
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
