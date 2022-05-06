import React, {useState} from 'react'

import {Button, Form, Notification, Panel, toaster} from 'rsuite'

import {useResetUserPasswordMutation} from '../api'

import {useTranslation} from 'react-i18next'

export interface ResetUserPasswordPanelProps {
  userID?: string
  userName?: string
  onClose(): void
}

export function ResetUserPasswordPanel({userID, userName, onClose}: ResetUserPasswordPanelProps) {
  const [password, setPassword] = useState('')

  const [
    resetUserPassword,
    {loading: isUpdating, error: updateError}
  ] = useResetUserPasswordMutation()

  const isDisabled = isUpdating

  const {t} = useTranslation()

  return (
    <Panel>
      <Form fluid={true}>
        <Form.Group>
          <Form.ControlLabel>{t('userList.panels.resetPasswordFor', {userName})}</Form.ControlLabel>
          <Form.Control
            name={'password'}
            disabled={isDisabled}
            type="password"
            placeholder={t('userList.panels.password')}
            errorMessage={updateError?.message}
            value={password}
            onChange={(value: string) => setPassword(value)}
          />
        </Form.Group>
      </Form>

      <Button
        disabled={isDisabled}
        appearance="primary"
        onClick={async () => {
          if (!userID || !password) {
            return
          }
          const {data} = await resetUserPassword({
            variables: {
              id: userID,
              password: password
            }
          })
          if (data?.resetUserPassword) {
            toaster.push(
              <Notification
                type="success"
                header={t('userList.panels.passwordChangeSuccess')}
                duration={5000}
              />,
              {placement: 'topEnd'}
            )
            onClose()
          }
        }}>
        {t('userList.panels.resetPassword')}
      </Button>
    </Panel>
  )
}
