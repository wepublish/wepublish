import React, {useState} from 'react'

import {DefaultMetadata} from './contentMetadataPanel'

import {useTranslation} from 'react-i18next'
import {Button, ControlLabel, DatePicker, Form, FormGroup, Message, Modal} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

export interface PublishArticlePanelProps {
  initialPublishDate?: Date
  pendingPublishDate?: Date
  metadata: DefaultMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date): void
}

export function PublishCustomContentPanel({
  initialPublishDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishArticlePanelProps) {
  const now = new Date()

  const [publishDate, setPublishDate] = useState<Date | undefined>(initialPublishDate ?? now)
  const [updateDate, setUpdateDate] = useState<Date | undefined>(now)

  const {t} = useTranslation()

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('articleEditor.panels.publishArticle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {pendingPublishDate && (
          <Message
            type="warning"
            description={t('articleEditor.panels.articlePending', {pendingPublishDate})}
          />
        )}
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.publishDate')}</ControlLabel>
            <DatePicker
              block
              value={publishDate}
              format="YYYY-MM-DD HH:mm"
              ranges={[
                {
                  label: 'Now',
                  value: new Date()
                }
              ]}
              onChange={publishDate => setPublishDate(publishDate)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('articleEditor.panels.updateDate')}</ControlLabel>
            <DatePicker
              block
              value={updateDate}
              format="YYYY-MM-DD HH:mm"
              ranges={[
                {
                  label: 'Now',
                  value: new Date()
                }
              ]}
              onChange={updateDate => setUpdateDate(updateDate)}
            />
          </FormGroup>
        </Form>

        <DescriptionList>
          <DescriptionListItem label={t('articleEditor.panels.title')}>
            {metadata.title || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.sharedWithPeers')}>
            {metadata.shared ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishDate || !updateDate}
          onClick={() => onConfirm(publishDate!, updateDate!)}>
          {t('articleEditor.panels.confirm')}
        </Button>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
