import {
  NewsletterSummaryFragment,
  useDeleteNewsletterMutation,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

type NewsletterDeleteModalProps = {
  newsletter: NewsletterSummaryFragment | undefined;
  onClose(): void;
  onDelete(): unknown;
};

export function NewsletterDeleteModal({
  newsletter,
  onClose,
  onDelete,
}: NewsletterDeleteModalProps) {
  const { t } = useTranslation();

  const [deleteNewsletter, { loading }] = useDeleteNewsletterMutation({
    onError: error => {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={4000}
        >
          {error.message}
        </Message>
      );
    },
    onCompleted: () => {
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
      onClose();
      onDelete();
    },
  });

  return (
    <Modal
      open={!!newsletter}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('newsletter.delete.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('newsletter.delete.body', { name: newsletter?.title })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          color="red"
          loading={loading}
          onClick={() =>
            newsletter && deleteNewsletter({ variables: { id: newsletter.id } })
          }
        >
          {t('newsletter.delete.delete')}
        </Button>
        <Button
          appearance="subtle"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
