import { useMutation, useQuery } from '@apollo/client/react';
import { IconButton } from '@mui/material';
import {
  CreateJwtForWebsiteLoginDocument,
  PeerProfileDocument,
} from '@wepublish/editor/api';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdPublic } from 'react-icons/md';

import { openPreviewWindow } from './openPreview';

export function WebsiteLoginButton() {
  const { t } = useTranslation();
  const { data } = useQuery(PeerProfileDocument);
  const [createJWT] = useMutation(CreateJwtForWebsiteLoginDocument, {
    errorPolicy: 'none',
    fetchPolicy: 'no-cache',
  });

  const websiteURL = data?.peerProfile.websiteURL;

  if (!websiteURL) {
    return null;
  }

  const open = () => {
    const result = openPreviewWindow(websiteURL, {
      createToken: async () =>
        (await createJWT()).data?.createJWTForWebsiteLogin.token,
      onSilence: () =>
        enqueueSnackbar(t('previewHandshake.notResponding'), {
          variant: 'warning',
        }),
    });

    if (result === 'popup-blocked') {
      enqueueSnackbar(t('previewHandshake.popupBlocked'), { variant: 'error' });
    }
  };

  return (
    <IconButton
      title={t('navbar.websiteLogin')}
      aria-label={t('navbar.websiteLogin')}
      onClick={open}
    >
      <MdPublic />
    </IconButton>
  );
}
