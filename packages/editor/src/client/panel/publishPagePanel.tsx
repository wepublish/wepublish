import React, {useState, useEffect} from 'react'

import {Button, Checkbox, Message, Modal} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {PageMetadata} from './pageMetadataPanel'

import {useTranslation} from 'react-i18next'
import {DateTimePicker} from '../atoms/dateTimePicker'
import {InfoColor} from '../atoms/infoMessage'
import {DescriptionListItemWithMessage} from '../atoms/descriptionListwithMessage'

export interface PublishPagePanelProps {
  publishedAtDate?: Date
  updatedAtDate?: Date
  publishAtDate?: Date
  pendingPublishDate?: Date
  isPublishDateActiveDate?: boolean
  metadata: PageMetadata

  onClose(): void
  onConfirm(publishedAt: Date, updatedAt: Date, publishAt: Date, isPublishDateActive: boolean): void
}

export function PublishPagePanel({
  publishedAtDate,
  updatedAtDate,
  publishAtDate,
  pendingPublishDate,
  isPublishDateActiveDate,
  metadata,
  onClose,
  onConfirm
}: PublishPagePanelProps) {
  const now = new Date()

  const [publishedAt, setPublishedAt] = useState<Date | undefined>(publishedAtDate ?? now)

  const [publishAt, setpublishAt] = useState<Date | undefined>(publishAtDate ?? undefined)

  const [updatedAt, setupdatedAt] = useState<Date | undefined>(updatedAtDate ?? now)

  const [isPublishDateActive, setIsPublishDateActive] = useState<boolean>(
    isPublishDateActiveDate ?? false
  )

  const {t} = useTranslation()

  useEffect(() => {
    if (!publishAt || !isPublishDateActive) {
      setpublishAt(publishedAt)
    }
  }, [isPublishDateActive, publishedAt])

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
          dateTime={publishedAt}
          label={t('pageEditor.panels.publishDate')}
          changeDate={date => setPublishedAt(date)}
        />
        <DateTimePicker
          dateTime={updatedAt}
          label={t('pageEditor.panels.updateDate')}
          changeDate={date => setupdatedAt(date)}
        />
        {updatedAt && publishedAt && updatedAt < publishedAt ? (
          <Message type="warning" description={t('pageEditor.panels.updateDateWarning')}></Message>
        ) : (
          ''
        )}

        <Checkbox
          value={isPublishDateActive}
          checked={isPublishDateActive}
          onChange={isPublishDateActive => setIsPublishDateActive(!isPublishDateActive)}>
          {' '}
          {t('pageEditor.panels.publishAtDateCheckbox')}
        </Checkbox>


        {isPublishDateActive ? (
          <DateTimePicker
            disabled={!isPublishDateActive}
            dateTime={!isPublishDateActive ? undefined : publishAt}
            label={t('pageEditor.panels.publishAt')}
            changeDate={date => {
              setpublishAt(date)
            }}
                      helpInfo={t('pageEditor.panels.dateExplanationPopOver')}

          />
        ) : (
          ''
        )}

        <DescriptionList>
          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.title')}
            message={t('pageEditor.panels.enterTitle')}
            messageType={InfoColor.warning}>
            {metadata.title}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.description')}
            message={t('pageEditor.panels.enterDescription')}
            messageType={InfoColor.warning}>
            {metadata.description}
          </DescriptionListItemWithMessage>

          <DescriptionListItem label={t('pageEditor.panels.slug')}>
            {metadata.slug || '-'}
          </DescriptionListItem>

          <DescriptionListItem label={t('pageEditor.panels.tags')}>
            {metadata.tags.join(', ') || '-'}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.image')}
            message={t('pageEditor.panels.enterImage')}
            messageType={InfoColor.warning}>
            {metadata.image?.filename}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaTitle')}
            message={t('pageEditor.panels.enterSocialMediaTitle')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaDescription')}
            message={t('pageEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaDescription}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaImage')}
            message={t('pageEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaImage?.filename}
          </DescriptionListItemWithMessage>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"

          disabled={!publishedAt || !updatedAt || updatedAt < publishedAt}
          onClick={() => onConfirm(publishedAt!, updatedAt!, publishAt!, isPublishDateActive!)}>

          {t('pageEditor.panels.confirm')}
        </Button>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('pageEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
