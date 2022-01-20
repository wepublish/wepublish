import React, {useState} from 'react'

import {ArticleMetadata} from './articleMetadataPanel'

import {useTranslation} from 'react-i18next'
import {Button, Message, Modal, Panel} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {DescriptionListItemWithMessage} from '../atoms/descriptionListwithMessage'

import {DateTimePicker} from '../atoms/dateTimePicker'
import {InfoColor} from '../atoms/infoMessage'

export interface PublishArticlePanelProps {
  initialPublishDate?: Date
  initialUpdateDate?: Date
  availableFromDate?: Date
  pendingPublishDate?: Date
  metadata: ArticleMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date, availableOnlineFrom: Date): void
}

export function PublishArticlePanel({
  initialPublishDate,
  initialUpdateDate,
  availableFromDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishArticlePanelProps) {
  const now = new Date()

  const [publishDate, setPublishDate] = useState<Date | undefined>(initialPublishDate ?? now)

  const [availableOnlineFrom, setAvailableOnlineFrom] = useState<Date | undefined>(
    availableFromDate ?? undefined
  )

  const [updateDate, setUpdateDate] = useState<Date | undefined>(initialUpdateDate ?? now)

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
            description={t('articleEditor.panels.articlePending', {
              pendingPublishDate
            })}
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

        <Panel
          header={t('articleEditor.panels.advancedOptions')}
          collapsible
          className="availableFromPublishPanel">
          <DateTimePicker
            dateTime={availableOnlineFrom}
            label={t('articleEditor.panels.availableOnlineFrom')}
            changeDate={date => setAvailableOnlineFrom(date)}
          />
        </Panel>

        <DescriptionList>
          <DescriptionListItem label={t('articleEditor.panels.preTitle')}>
            {metadata.preTitle || '-'}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.title')}
            message={t('articleEditor.panels.enterTitle')}
            messageType={InfoColor.warning}>
            {metadata.title}
          </DescriptionListItemWithMessage>

          <DescriptionListItem label={t('articleEditor.panels.lead')}>
            {metadata.lead || '-'}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.seoTitle')}
            message={t('articleEditor.panels.enterSeoTitle')}
            messageType={InfoColor.warning}>
            {metadata.seoTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.authors')}
            message={t('articleEditor.panels.enterAuthors')}
            messageType={InfoColor.warning}>
            {metadata.authors.map(e => e.name).join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.slug')}
            message={t('articleEditor.panels.addSlug')}
            messageType={InfoColor.error}>
            {metadata.slug}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.tags')}
            message={t('articleEditor.panels.enterTag')}
            messageType={InfoColor.warning}>
            {metadata.tags.join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.image')}
            message={t('articleEditor.panels.enterImage')}
            messageType={InfoColor.warning}>
            {metadata.image?.filename}
          </DescriptionListItemWithMessage>

          <DescriptionListItem label={t('articleEditor.panels.breakingNews')}>
            {metadata.breaking ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.sharedWithPeers')}>
            {metadata.shared ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.hideAuthors')}>
            {metadata.hideAuthor ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaTitle')}
            message={t('articleEditor.panels.enterSocialMediaTitle')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaDescription')}
            message={t('articleEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaDescription}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaAuthors')}
            message={t('articleEditor.panels.enterSocialMediaAuthors')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaAuthors.map(e => e.name).join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaImage')}
            message={t('articleEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}>
            {metadata.socialMediaImage?.filename}
          </DescriptionListItemWithMessage>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishDate || !updateDate || !metadata.slug}
          onClick={() => onConfirm(publishDate!, updateDate!, availableOnlineFrom!)}>
          {t('articleEditor.panels.confirm')}
        </Button>

        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
