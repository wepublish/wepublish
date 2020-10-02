import React, {useState} from 'react'

import {
  PanelHeader,
  Panel,
  PanelSection,
  NavigationButton,
  TextInput,
  Spacing,
  Typography,
  Button,
  Toast,
  ToastType
} from '@karma.run/ui'

import {MaterialIconClose} from '@karma.run/icons'
import {useResetUserPasswordMutation} from '../api'

import {useTranslation} from 'react-i18next'

export interface ResetUserPasswordPanelProps {
  userID?: string
  userName?: string
  onClose(): void
}

export function ResetUserPasswordPanel({userID, userName, onClose}: ResetUserPasswordPanelProps) {
  const [password, setPassword] = useState('')

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ToastType>('success')

  const [
    resetUserPassword,
    {loading: isUpdating, error: updateError}
  ] = useResetUserPasswordMutation()

  const isDisabled = isUpdating

  const {t} = useTranslation()

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('Reset Password')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('Close')}
              onClick={() => onClose()}
            />
          }
        />
        <PanelSection>
          <Typography variant="body1">{t('Reset the password for ', {userName})}</Typography>
          <TextInput
            disabled={isDisabled}
            type="password"
            label={t('Password')}
            errorMessage={updateError?.message}
            marginBottom={Spacing.Small}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            disabled={isDisabled}
            label={t('Reset Password')}
            variant="outlined"
            color="primary"
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
                setType('success')
                setOpen(true)
                onClose()
              }
            }}
          />
        </PanelSection>
      </Panel>
      <Toast type={type} open={open} onClose={() => setOpen(false)} autoHideDuration={2000}>
        {t('Password successfuly changed!')}
      </Toast>
    </>
  )
}
