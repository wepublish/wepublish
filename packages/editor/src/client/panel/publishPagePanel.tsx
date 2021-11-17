import React, {useState} from 'react'

import {Button, Message, Modal} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {PageMetadata} from './pageMetadataPanel'

import {useTranslation} from 'react-i18next'
import {DateTimePicker} from '../atoms/dateTimePicker'

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

  const [publishDate, setPublishDate] = useState<Date | undefined>(
    pendingPublishDate ?? initialPublishDate ?? now
  )
  const [updateDate, setUpdateDate] = useState<Date | undefined>(now)

  const {t} = useTranslation()

  const missingInfoStyle = {
    borderRadius: '8px',
    padding: '6px',
    backgroundColor: '#FFEBCD'
  }

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
        <DateTimePicker
          dateTime={publishDate}
          label={t('articleEditor.panels.publishDate')}
          changeDate={date => setPublishDate(date)}
        />
        <DateTimePicker
          dateTime={updateDate}
          label={t('articleEditor.panels.updateDate')}
          changeDate={date => setUpdateDate(date)}
        />

        <DescriptionList>
          <DescriptionListItem label={t('pageEditor.panels.title')}>
            {metadata.title ? (
              metadata.title
            ) : (
              <div style={missingInfoStyle}>{t('pageEditor.panels.enterTitle')}</div>
            )}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.description')}>
            {metadata.description ? (
              metadata.description
            ) : (
              <div style={missingInfoStyle}>{t('pageEditor.panels.enterDescription')}</div>
            )}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.slug')}>
            {metadata.slug || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.tags')}>
            {metadata.tags.join(', ') || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('pageEditor.panels.image')}>
            {metadata.image ? (
              metadata.image.filename
            ) : (
              <div style={missingInfoStyle}>{t('pageEditor.panels.enterImage')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('pageEditor.panels.socialMediaTitle')}>
            {metadata.socialMediaTitle ? (
              metadata.socialMediaTitle
            ) : (
              <div style={missingInfoStyle}>{t('pageEditor.panels.enterSocialMediaTitle')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('pageEditor.panels.socialMediaDescription')}>
            {metadata.socialMediaDescription ? (
              metadata.socialMediaDescription
            ) : (
              <div style={missingInfoStyle}>
                {t('pageEditor.panels.enterSocialMediaDescription')}
              </div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('pageEditor.panels.socialMediaImage')}>
            {metadata.socialMediaImage ? (
              metadata.socialMediaImage.filename
            ) : (
              <div style={missingInfoStyle}>{t('pageEditor.panels.enterSocialMediaImage')}</div>
            )}
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
