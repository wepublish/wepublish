import React, {useState} from 'react'

import {MaterialIconClose, MaterialIconCloudUploadOutlined} from '@karma.run/icons'

import {
  Box,
  FileDropInput,
  NavigationButton,
  Panel,
  PanelHeader,
  PanelSection,
  Toast
} from '@karma.run/ui'

import {useTranslation} from 'react-i18next'

export interface ImageUploadPanelProps {
  onClose(): void
  onUpload(file: File): void
}

export function ImageUploadPanel({onClose, onUpload}: ImageUploadPanelProps) {
  const [errorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {t} = useTranslation()

  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      setErrorToastOpen(true)
      setErrorMessage('Invalid Image')
      return
    }

    onUpload(file)
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('Upload Image')}
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('Close')}
              onClick={() => onClose()}
            />
          }
        />
        <PanelSection>
          <Box height={100}>
            <FileDropInput
              icon={MaterialIconCloudUploadOutlined}
              text={t('Drop Image Here')}
              onDrop={handleDrop}
            />
          </Box>
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={errorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
