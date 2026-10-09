import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
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
import { Form } from 'rsuite';

import { enqueueSnackbar } from '../../snackbar';
import { toggleRequiredLabel } from '../../toggleRequiredLabel';
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

interface CreateOrUpdateuserPasswordProps {
  user?: FullUserFragment | null;
  password?: string;
  setPassword(password: string): void;
  isDisabled: boolean;
}

export function EditUserPassword({
  user,
  password,
  setPassword,
  isDisabled,
}: CreateOrUpdateuserPasswordProps) {
  const { t } = useTranslation();
  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] =
    useState<boolean>(false);
  const [sendLoginModalOpen, setSendLoginModalOpen] = useState<boolean>(false);

  const [sendWebsiteLogin] = useMutation(SendWebsiteLoginDocument);

  async function sendLoginLink() {
    if (!user) {
      enqueueSnackbar(
        t('createOrUpdateUserPassword.unexpectedErrorNoUserFound'),
        { variant: 'error', autoHideDuration: 8000 }
      );
      return;
    }
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
  function createOrResetPasswordView() {
    // edit form
    if (user) {
      return (
        <Form.Group>
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
        </Form.Group>
      );
    }

    // create new password form
    return (
      <Form.Group controlId="password">
        <Form.Label>
          {toggleRequiredLabel(t('userCreateOrEditView.password'))}
        </Form.Label>

        <Form.Control
          type="password"
          name="password"
          value={password}
          disabled={isDisabled}
          onChange={(value: string) => {
            setPassword(value);
          }}
        />
      </Form.Group>
    );
  }

  function resetPasswordModal() {
    const userId = user?.id;

    if (!userId) {
      return null;
    }

    const userName =
      user?.firstName ? `${user.firstName} ${user.name}` : user.name;

    return (
      <Dialog
        open={isResetUserPasswordOpen}
        onClose={() => setIsResetUserPasswordOpen(false)}
      >
        <DialogTitle>{t('userCreateOrEditView.resetPassword')}</DialogTitle>

        <DialogContent>
          <ResetUserPasswordForm
            userID={userId}
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
            email: user?.email,
            firstName: user?.firstName,
            name: user?.name,
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
      {createOrResetPasswordView()}
      {resetPasswordModal()}
      {sendLoginLinkModal()}
    </>
  );
}
