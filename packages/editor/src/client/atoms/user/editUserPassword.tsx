import React, {useState} from 'react'
import {Button, Form, Message, Modal, toaster} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {FullUserFragment, useSendWebsiteLoginMutation} from '../../api'
import {Reload, Send} from '@rsuite/icons'
import {ResetUserPasswordForm} from './resetUserPasswordForm'
import {toggleRequiredLabel} from '../../toggleRequiredLabel'

interface CreateOrUpdateuserPasswordProps {
  user?: FullUserFragment | null
  password?: string
  setPassword(password: string): void
  isDisabled: boolean
}

export function EditUserPassword({
  user,
  password,
  setPassword,
  isDisabled
}: CreateOrUpdateuserPasswordProps) {
  const {t} = useTranslation()
  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState<boolean>(false)
  const [sendLoginModalOpen, setSendLoginModalOpen] = useState<boolean>(false)
  const [sendWebsiteLogin] = useSendWebsiteLoginMutation()

  async function sendLoginLink() {
    if (!user) {
      toaster.push(
        <Message type="error" showIcon closable duration={2000}>
          {t('createOrUpdateUserPassword.unexpectedErrorNoUserFound')}
        </Message>
      )
      return
    }
    try {
      await sendWebsiteLogin({variables: {email: user.email}})
      // close modal
      setSendLoginModalOpen(false)
      toaster.push(
        <Message type="success" showIcon closable duration={2000}>
          {t('userCreateOrEditView.sendWebsiteLoginSuccessMessage', {email: user.email})}
        </Message>
      )
    } catch (error) {
      toaster.push(
        <Message type="error" showIcon closable duration={2000}>
          {t('userList.panel.sendWebsiteLoginFailureMessage', {error})}
        </Message>
      )
    }
  }

  /**
   * UI helpers
   */
  function createOrResetPasswordView() {
    // edit form
    if (user) {
      return (
        <>
          <Form.Group>
            <Button appearance="primary" onClick={() => setIsResetUserPasswordOpen(true)}>
              <Reload style={{marginRight: '5px'}} />
              {t('userCreateOrEditView.resetPassword')}
            </Button>
            <Button
              appearance="primary"
              color="red"
              style={{marginLeft: '20px'}}
              disabled={isDisabled || !user.email || !user.active}
              onClick={() => setSendLoginModalOpen(true)}>
              <Send style={{marginRight: '5px'}} />
              {t('userCreateOrEditView.sendWebsiteLogin')}
            </Button>
          </Form.Group>
        </>
      )
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
            setPassword(value)
          }}
        />
      </Form.Group>
    )
  }

  function resetPasswordModal() {
    const userId = user?.id
    if (!userId) return <></>
    const userName = user?.firstName ? `${user.firstName} ${user.name}` : user.name
    return (
      <Modal open={isResetUserPasswordOpen} onClose={() => setIsResetUserPasswordOpen(false)}>
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
          <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
            {t('userCreateOrEditView.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  function sendLoginLinkModal() {
    return (
      <>
        <Modal open={sendLoginModalOpen} onClose={() => setSendLoginModalOpen(false)}>
          <Modal.Header>
            <Modal.Title>{t('createOrEditUserPassword.sendLoginLink')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('createOrEditUserPassword.sendLoginLinkContent', {
              email: user?.email,
              firstName: user?.firstName,
              name: user?.name
            })}
          </Modal.Body>
          <Modal.Footer>
            <Button appearance="ghost" onClick={() => setSendLoginModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button appearance="primary" onClick={sendLoginLink}>
              {t('userCreateOrEditView.sendWebsiteLogin')}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    )
  }

  return (
    <>
      {createOrResetPasswordView()}
      {resetPasswordModal()}
      {sendLoginLinkModal()}
    </>
  )
}
