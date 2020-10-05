import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  Toast,
  Typography,
  Card
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {useCreateTokenMutation, TokenListDocument} from '../api'
import {getOperationNameFromDocument} from '../utility'

import {useTranslation} from 'react-i18next'

export interface TokenGeneratePanelProps {
  onClose?(): void
}

export function TokenGeneratePanel({onClose}: TokenGeneratePanelProps) {
  const [name, setName] = useState('')

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const [createToken, {data, loading: isCreating, error: createError}] = useCreateTokenMutation({
    refetchQueries: [getOperationNameFromDocument(TokenListDocument)]
  })

  const isDisabled = isCreating
  const token = data?.createToken.token
  const hasGeneratedToken = token !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    }
  }, [createError])

  async function handleSave() {
    await createToken({variables: {input: {name}}})
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('Generate Token')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('Close')}
              onClick={() => onClose?.()}
            />
          }
          rightChildren={
            !hasGeneratedToken && (
              <NavigationButton
                icon={MaterialIconSaveOutlined}
                label={t('Generate')}
                disabled={isDisabled}
                onClick={handleSave}
              />
            )
          }
        />

        <PanelSection>
          {token ? (
            <>
              <Box marginBottom={Spacing.Small}>
                <Typography variant="body1">{t('Token creation success')}</Typography>
              </Box>
              <Card padding={Spacing.ExtraSmall}>
                <Typography variant="body2" align="center">
                  {token}
                </Typography>
              </Card>
            </>
          ) : (
            <TextInput
              marginBottom={Spacing.ExtraSmall}
              label={t('Name')}
              value={name}
              disabled={isDisabled}
              onChange={e => {
                setName(e.target.value)
              }}
            />
          )}
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
