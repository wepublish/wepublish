import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'rsuite';

export interface ConfirmActionModalProps {
  title: string;
  message: ReactNode;
  loading?: boolean;
  onConfirm(): void;
  onClose(): void;
}

export function ConfirmActionModal({
  title,
  message,
  loading,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      role="alertdialog"
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{message}</Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          loading={loading}
          onClick={onConfirm}
        >
          {t('confirm')}
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
