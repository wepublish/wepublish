import React from 'react'
import {Button, Modal} from 'rsuite'
import {useTranslation} from 'react-i18next'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface ContentMetadata {
  readonly title: string
  readonly shared: boolean
}

export interface ContentMetadataPanelModalProps {
  readonly children: any
  onClose?(): void
}

export function ContentMetadataPanelModal({children, onClose}: ContentMetadataPanelModalProps) {
  const {t} = useTranslation()

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('articleEditor.panels.metadata')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      <Modal.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
