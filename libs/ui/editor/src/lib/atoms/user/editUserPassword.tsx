import styled from '@emotion/styled';
import {
  FullUserFragment,
  getApiClientV2,
  useSendWebsiteLoginMutation,
} from '@wepublish/editor/api-v2';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdReplay, MdSend } from 'react-icons/md';
import { Button as RButton, Form, Message, Modal, toaster } from 'rsuite';

import { toggleRequiredLabel } from '../../toggleRequiredLabel';
import { ResetUserPasswordForm } from './resetUserPasswordForm';

const ReplayIcon = styled(MdReplay)`
  margin-right: 5px;
`;

const SendIcon = styled(MdSend)`
  margin-right: 5px;
`;

const Button = styled(RButton)`
  margin-left: 20px;
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
  const client = getApiClientV2();
  const [sendWebsiteLogin] = useSendWebsiteLoginMutation({ client });

  async function sendLoginLink() {
    if (!user) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={2000}
        >
          {t('createOrUpdateUserPassword.unexpectedErrorNoUserFound')}
        </Message>
      );
      return;
    }
    try {
      await sendWebsiteLogin({ variables: { email: user.email } });
      // close modal
      setSendLoginModalOpen(false);
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={2000}
        >
          {t('userCreateOrEditView.sendWebsiteLoginSuccessMessage', {
            email: user.email,
          })}
        </Message>
      );
    } catch (error) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={2000}
        >
          {t('userList.panel.sendWebsiteLoginFailureMessage', { error })}
        </Message>
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
          <RButton
            appearance="primary"
            onClick={() => setIsResetUserPasswordOpen(true)}
          >
            <ReplayIcon />
            {t('userCreateOrEditView.resetPassword')}
          </RButton>
          <Button
            appearance="primary"
            color="red"
            disabled={isDisabled || !user.email || !user.active}
            onClick={() => setSendLoginModalOpen(true)}
          >
            <SendIcon />
            {t('userCreateOrEditView.sendWebsiteLogin')}
          </Button>
        </Form.Group>
      );
    }

    // create new password form
    return (
      <Form.Group controlId="password">
        <Form.ControlLabel>
          {toggleRequiredLabel(t('userCreateOrEditView.password'))}
        </Form.ControlLabel>

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

  function resetPasswordModal(): JSX.Element {
    const userId = user?.id;
    if (!userId) {
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <></>;
    }
    const userName =
      user?.firstName ? `${user.firstName} ${user.name}` : user.name;
    return (
      <Modal
        open={isResetUserPasswordOpen}
        onClose={() => setIsResetUserPasswordOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('userCreateOrEditView.resetPassword')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ResetUserPasswordForm
            userID={userId}
            userName={userName}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        </Modal.Body>

        <Modal.Footer>
          <RButton
            onClick={() => setIsResetUserPasswordOpen(false)}
            appearance="subtle"
          >
            {t('userCreateOrEditView.cancel')}
          </RButton>
        </Modal.Footer>
      </Modal>
    );
  }

  function sendLoginLinkModal() {
    return (
      <Modal
        open={sendLoginModalOpen}
        onClose={() => setSendLoginModalOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>
            {t('createOrEditUserPassword.sendLoginLink')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('createOrEditUserPassword.sendLoginLinkContent', {
            email: user?.email,
            firstName: user?.firstName,
            name: user?.name,
          })}
        </Modal.Body>
        <Modal.Footer>
          <RButton
            appearance="ghost"
            onClick={() => setSendLoginModalOpen(false)}
          >
            {t('cancel')}
          </RButton>
          <RButton
            appearance="primary"
            onClick={sendLoginLink}
          >
            {t('userCreateOrEditView.sendWebsiteLogin')}
          </RButton>
        </Modal.Footer>
      </Modal>
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
