import React from 'react'
import {Form} from 'rsuite'
import {useTranslation} from 'react-i18next'
import {ResetUserPasswordPanel} from '../../panel/resetUserPasswordPanel'

interface CreateOrUpdateuserPasswordProps {
  userId?: string
  password?: string
  setPassword(password: string): void
  isDisabled: boolean
}

export function CreateOrUpdateUserPassword({
  userId,
  password,
  setPassword,
  isDisabled
}: CreateOrUpdateuserPasswordProps) {
  const {t} = useTranslation()

  /**
   * UI helpers
   */
  function createOrResetPasswordView() {
    // if user is in edit mode, only provide button to reset password
    if (userId) {
      return (
        <>
          <ResetUserPasswordPanel
            userID={userId}
            onClose={() => {
              console.log('closed')
            }}
          />
        </>
      )
    }

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

  return <>{createOrResetPasswordView()}</>
}
