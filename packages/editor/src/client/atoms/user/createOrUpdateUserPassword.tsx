import React, {useState} from 'react'
import {Button, Form, Message, Modal, toaster} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {FullUserFragment, useSendWebsiteLoginMutation} from '../../api'
import {Reload, Send} from '@rsuite/icons'
import {ResetUserPasswordPanel} from '../../panel/resetUserPasswordPanel'

interface CreateOrUpdateuserPasswordProps {
  user?: FullUserFragment | null
  password?: string
  setPassword(password: string): void
  isDisabled: boolean
}

export function CreateOrUpdateUserPassword({
  user,
  password,
  setPassword,
  isDisabled
}: CreateOrUpdateuserPasswordProps) {
  const {t} = useTranslation()
  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)
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
      toaster.push(
        <Message type="success" showIcon closable duration={2000}>
          {t('userList.panels.sendWebsiteLoginSuccessMessage', {email: user.email})}
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
              {t('userList.panels.resetPassword')}
            </Button>
            <Button
              appearance="primary"
              color="red"
              style={{marginLeft: '20px'}}
              disabled={isDisabled || !user.email || !user.active}
              onClick={sendLoginLink}>
              <Send style={{marginRight: '5px'}} />
              {t('userList.panels.sendWebsiteLogin')}
            </Button>
          </Form.Group>
        </>
      )
    }

    // create new password form
    return (
      <Form.Group controlId="password">
        <Form.ControlLabel>{t('userList.panels.password') + '*'}</Form.ControlLabel>
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
          <Modal.Title>{t('userList.panels.resetPassword')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ResetUserPasswordPanel
            userID={userId}
            userName={userName}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
            {t('userList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  return (
    <>
      {createOrResetPasswordView()}
      {resetPasswordModal()}
    </>
  )
}
