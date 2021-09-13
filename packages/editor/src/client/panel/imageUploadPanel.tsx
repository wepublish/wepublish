import React from 'react'

import {Button, Drawer, Icon, Notification} from 'rsuite'

import {FileDropInput} from '../atoms/fileDropInput'

import {useTranslation} from 'react-i18next'

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
      Notification.error({
        title: t('articleEditor.panels.învalidImage'),
        duration: 5000
      })
    }

    onUpload(file)
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.uploadImage')}</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <div style={{height: '100px'}}>
          <FileDropInput
            icon={<Icon icon="upload" />}
            text={t('articleEditor.panels.dropImage')}
            onDrop={handleDrop}
          />
        </div>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
