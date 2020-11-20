import React, {useState} from 'react'

import {Button, ControlLabel, DatePicker, Form, FormGroup, Message, Modal} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {PageMetadata} from './pageMetadataPanel'

import {useTranslation} from 'react-i18next'

export interface PublishPagePanelProps {
  initialPublishDate?: Date
  pendingPublishDate?: Date
  metadata: PageMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date): void
}

export function PublishPagePanel({
  initialPublishDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishPagePanelProps) {
  const now = new Date()

  const [publishDate, setPublishDate] = useState<Date | undefined>(initialPublishDate ?? now)
  const [updateDate, setUpdateDate] = useState<Date | undefined>(now)

  const {t} = useTranslation()

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('pageEditor.panels.publishPage')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {pendingPublishDate && (
          <Message
            type="warning"
            description={t('pageEditor.panels.pagePending', {pendingPublishDate})}
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
          <DescriptionListItem label={t('pageEditor.panels.title')}>
            {metadata.title}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.description')}>
            {metadata.description}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.slug')}>
            {metadata.slug}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.tags')}>
            {metadata.tags.join(', ')}
          </DescriptionListItem>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishDate || !updateDate}
          onClick={() => onConfirm(publishDate!, updateDate!)}>
          {t('pageEditor.panels.confirm')}
        </Button>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('pageEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
