import { ApolloError, ApolloQueryResult } from '@apollo/client';
import {
  Crowdfunding,
  CrowdfundingsQuery,
  useDeleteCrowdfundingMutation,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

type DeleteCrowdfundingProps = {
  crowdfunding: Crowdfunding | undefined;
  onClose(): void;
  onDelete(): Promise<ApolloQueryResult<CrowdfundingsQuery>>;
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

export function CrowdfundingDeleteModal({
  crowdfunding,
  onClose,
  onDelete,
}: DeleteCrowdfundingProps) {
  const { t } = useTranslation();

  const [deleteCrowdfundingMutation] = useDeleteCrowdfundingMutation({
    onError: onErrorToast,
    onCompleted: onCompletedToast(t),
  });

  async function deleteCrowdfunding() {
    if (!crowdfunding) {
      return;
    }

    await deleteCrowdfundingMutation({
      variables: {
        id: crowdfunding.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Modal
      open={!!crowdfunding}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('crowdfunding.delete.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('crowdfunding.delete.body', {
          name: crowdfunding?.name,
        })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={deleteCrowdfunding}
          appearance="primary"
          color="red"
        >
          {t('crowdfunding.delete.delete')}
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
