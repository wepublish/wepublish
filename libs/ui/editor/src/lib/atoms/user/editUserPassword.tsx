import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  FullUserFragment,
  SendWebsiteLoginDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdReplay, MdSend } from 'react-icons/md';

import { enqueueSnackbar } from '../../snackbar';
import { ResetUserPasswordForm } from './resetUserPasswordForm';

const ReplayIcon = styled(MdReplay)`
  margin-right: 5px;
`;

const SendIcon = styled(MdSend)`
  margin-right: 5px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
`;

interface EditUserPasswordProps {
  user: FullUserFragment;
  isDisabled: boolean;
}

export function EditUserPassword({ user, isDisabled }: EditUserPasswordProps) {
  const { t } = useTranslation();
  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] =
    useState<boolean>(false);
  const [sendLoginModalOpen, setSendLoginModalOpen] = useState<boolean>(false);

  const [sendWebsiteLogin] = useMutation(SendWebsiteLoginDocument);

  async function sendLoginLink() {
    try {
      await sendWebsiteLogin({ variables: { email: user.email } });
      // close modal
      setSendLoginModalOpen(false);
      enqueueSnackbar(
        t('userCreateOrEditView.sendWebsiteLoginSuccessMessage', {
          email: user.email,
        }),
        { variant: 'success', autoHideDuration: 2000 }
      );
    } catch (error) {
      enqueueSnackbar(
        t('userCreateOrEditView.sendWebsiteLoginFailureMessage', { error }),
        { variant: 'error', autoHideDuration: 8000 }
      );
    }
  }

  /**
   * UI helpers
   */
  function resetPasswordModal() {
    const userName =
      user.firstName ? `${user.firstName} ${user.name}` : user.name;

    return (
      <Dialog
        open={isResetUserPasswordOpen}
        onClose={() => setIsResetUserPasswordOpen(false)}
      >
        <DialogTitle>{t('userCreateOrEditView.resetPassword')}</DialogTitle>

        <DialogContent>
          <ResetUserPasswordForm
            userID={user.id}
            userName={userName}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setIsResetUserPasswordOpen(false)}
          >
            {t('userCreateOrEditView.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  function sendLoginLinkModal() {
    return (
      <Dialog
        open={sendLoginModalOpen}
        onClose={() => setSendLoginModalOpen(false)}
      >
        <DialogTitle>{t('createOrEditUserPassword.sendLoginLink')}</DialogTitle>
        <DialogContent>
          {t('createOrEditUserPassword.sendLoginLinkContent', {
            email: user.email,
            firstName: user.firstName,
            name: user.name,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setSendLoginModalOpen(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={sendLoginLink}
          >
            {t('userCreateOrEditView.sendWebsiteLogin')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Box>
        <ButtonWrapper>
          <Button
            variant="contained"
            onClick={() => setIsResetUserPasswordOpen(true)}
          >
            <ReplayIcon />
            {t('userCreateOrEditView.resetPassword')}
          </Button>
          <Button
            variant="contained"
            disabled={isDisabled || !user.email || !user.active}
            onClick={() => setSendLoginModalOpen(true)}
          >
            <SendIcon />
            {t('userCreateOrEditView.sendWebsiteLogin')}
          </Button>
        </ButtonWrapper>
      </Box>
      {resetPasswordModal()}
      {sendLoginLinkModal()}
    </>
  );
}
