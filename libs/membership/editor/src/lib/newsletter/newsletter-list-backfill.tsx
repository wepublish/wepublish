import { useBackfillNewsletterListMutation } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Message, Modal, toaster } from 'rsuite';

type NewsletterListBackfillProps = {
  listId: string;
};

export const NewsletterListBackfill = ({
  listId,
}: NewsletterListBackfillProps) => {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [backfill, { loading }] = useBackfillNewsletterListMutation();

  const onConfirm = async () => {
    setConfirmOpen(false);

    try {
      const { data } = await backfill({ variables: { id: listId } });

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('newsletter.backfill.success', {
            count: data?.backfillNewsletterList ?? 0,
          })}
        </Message>
      );
    } catch (error) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {(error as Error).message}
        </Message>
      );
    }
  };

  return (
    <Form.Group>
      <Button
        appearance="ghost"
        loading={loading}
        onClick={() => setConfirmOpen(true)}
      >
        {t('newsletter.backfill.button')}
      </Button>
      <Form.HelpText>{t('newsletter.backfill.help')}</Form.HelpText>

      <Modal
        open={confirmOpen}
        backdrop="static"
        size="xs"
        onClose={() => setConfirmOpen(false)}
      >
        <Modal.Title>{t('newsletter.backfill.confirmTitle')}</Modal.Title>
        <Modal.Body>{t('newsletter.backfill.confirmBody')}</Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={onConfirm}
          >
            {t('newsletter.backfill.confirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setConfirmOpen(false)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Form.Group>
  );
};
