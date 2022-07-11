import React, {useState} from 'react'

import {Button, Form, Notification, Schema, toaster} from 'rsuite'

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

  // Schema used for form validation
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    password: StringType()
      .isRequired(t('errorMessages.noPasswordErrorMessage'))
      .minLength(8, t('errorMessages.passwordTooShortErrorMessage'))
  })

  return (
    <Form
      fluid
      model={validationModel}
      onSubmit={async (validationPassed, e) => {
        console.log('1', userID, password)
        e.preventDefault()
        if (!userID || !password) {
          return
        }

        console.log('2')
        const {data} = await resetUserPassword({
          variables: {
            id: userID,
            password: password
          }
        })
        console.log('3', data)
        if (data?.resetUserPassword) {
          toaster.push(
            <Notification
              type="success"
              header={t('userCreateOrEditView.passwordChangeSuccess')}
              duration={5000}
            />,
            {placement: 'topEnd'}
          )
          onClose()
        }
      }}>
      <Form.Group>
        <Form.ControlLabel>
          {t('userCreateOrEditView.resetPasswordFor', {userName})}
        </Form.ControlLabel>
        <Form.Control
          name="password"
          disabled={isDisabled}
          type="password"
          placeholder={t('userCreateOrEditView.password')}
          errorMessage={updateError?.message}
          value={password}
          onChange={(value: string) => setPassword(value)}
        />
      </Form.Group>

      <Button type="submit" disabled={isDisabled} appearance="primary" color="red">
        {t('userCreateOrEditView.resetPassword')}
      </Button>
    </Form>
  )
}
