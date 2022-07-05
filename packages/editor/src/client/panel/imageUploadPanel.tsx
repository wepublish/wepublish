import React from 'react'

import {Button, Drawer, Notification, toaster, Form} from 'rsuite'

import {FileDropInput} from '../atoms/fileDropInput'

import {useTranslation} from 'react-i18next'
import {getImgMinSizeToCompress} from '../utility'
import UploadIcon from '@rsuite/icons/legacy/Upload'

export interface ImageUploadPanelProps {
  onClose(): void
  onUpload(file: File): void
}

export function ImageUploadPanel({onClose, onUpload}: ImageUploadPanelProps) {
  const {t} = useTranslation()
  async function handleDrop(files: File[]) {
    if (files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image')) {
      toaster.push(
        <Notification
          type="error"
          header={t('articleEditor.panels.învalidImage')}
          duration={5000}
        />,
        {placement: 'topEnd'}
      )
    }

    onUpload(file)
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.uploadImage')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('articleEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <div style={{height: '100px'}}>
          <FileDropInput
            icon={<UploadIcon />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </div>
        <Form.ControlLabel>
          <br />
          {t('images.panels.resizedImage', {sizeMB: getImgMinSizeToCompress()})}
        </Form.ControlLabel>
      </Drawer.Body>
    </>
  )
}
