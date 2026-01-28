import { ApolloError, ApolloQueryResult } from '@apollo/client';
import {
  Banner,
  BannersQuery,
  getApiClientV2,
  useDeleteBannerMutation,
} from '@wepublish/editor/api-v2';
import { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal, toaster } from 'rsuite';

type DeleteBannerProps = {
  banner: Banner | undefined;
  onClose(): void;
  onDelete(): Promise<ApolloQueryResult<BannersQuery>>;
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

export function BannerDeleteModal({
  banner,
  onClose,
  onDelete,
}: DeleteBannerProps) {
  const { t } = useTranslation();

  const client = useMemo(() => getApiClientV2(), []);
  const [deleteBannerMutation] = useDeleteBannerMutation({
    client,
    onError: onErrorToast,
    onCompleted: onCompletedToast(t),
  });

  async function deleteBanner() {
    if (!banner) {
      return;
    }

    await deleteBannerMutation({
      variables: {
        id: banner.id,
      },
    });

    onClose();
    onDelete();
  }

  return (
    <Modal
      open={!!banner}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('banner.delete.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {t('banner.delete.body', {
          name: banner?.title,
        })}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={deleteBanner}
          appearance="primary"
          color="red"
        >
          {t('banner.delete.delete')}
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
