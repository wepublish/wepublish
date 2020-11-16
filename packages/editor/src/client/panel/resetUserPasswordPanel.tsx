import React, {useState} from 'react'

import {Button, ControlLabel, Form, FormControl, FormGroup, Notification, Panel} from 'rsuite'

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
        <FormGroup>
          <ControlLabel>{t('userList.panels.resetPasswordFor', {userName})}</ControlLabel>
          <FormControl
            disabled={isDisabled}
            type="password"
            placeholder={t('userList.panels.password')}
            errorMessage={updateError?.message}
            value={password}
            onChange={value => setPassword(value)}
          />
        </FormGroup>
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
            Notification.success({
              title: t('userList.panels.passwordChangeSuccess'),
              duration: 2000
            })
            onClose()
          }
        }}>
        {t('userList.panels.resetPassword')}
      </Button>
    </Panel>
  )
}
