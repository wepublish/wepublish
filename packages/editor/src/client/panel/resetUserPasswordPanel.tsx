import React, {useState} from 'react'

import {Button, Form, Notification, Panel, Schema, toaster} from 'rsuite'

import {useResetUserPasswordMutation} from '../api'

import {useTranslation} from 'react-i18next'

export interface ResetUserPasswordPanelProps {
  userID: string
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

  async function handleSave() {
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
  }
  // Schema used for form validation
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    password: StringType()
      .isRequired(t('errorMessages.noPasswordErrorMessage'))
      .minLength(8, t('errorMessages.passwordTooShortErrorMessage'))
  })

  return (
    <Panel>
      <Form
        fluid
        model={validationModel}
        onSubmit={validationPassed => validationPassed && handleSave()}>
        <Form.Group>
          <Form.ControlLabel>{t('userList.panels.resetPasswordFor', {userName})}</Form.ControlLabel>
          <Form.Control
            name="password"
            disabled={isDisabled}
            type="password"
            placeholder={t('userList.panels.password')}
            errorMessage={updateError?.message}
            value={password}
            onChange={(value: string) => setPassword(value)}
          />
        </Form.Group>
      </Form>

      <Button type="submit" disabled={isDisabled} appearance="primary">
        {t('userList.panels.resetPassword')}
      </Button>
    </Panel>
  )
}
