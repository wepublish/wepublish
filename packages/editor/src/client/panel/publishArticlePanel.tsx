import React, {useState} from 'react'

import {ArticleMetadata} from './articleMetadataPanel'

import {useTranslation} from 'react-i18next'
import {Button, Message, Modal} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {DateTimePicker} from '../atoms/dateTimePicker'

export interface PublishArticlePanelProps {
  initialPublishDate?: Date
  pendingPublishDate?: Date
  metadata: ArticleMetadata

  onClose(): void
  onConfirm(publishDate: Date, updateDate: Date): void
}

export function PublishArticlePanel({
  initialPublishDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishArticlePanelProps) {
  const now = new Date()

  const [publishDate, setPublishDate] = useState<Date | undefined>(
    pendingPublishDate ?? initialPublishDate ?? now
  )
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

        <DescriptionList>
          <DescriptionListItem label={t('articleEditor.panels.preTitle')}>
            {metadata.preTitle || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.title')}>
            {metadata.title || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.lead')}>
            {metadata.lead || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.seoTitle')}>
            {metadata.seoTitle || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.slug')}>
            {metadata.slug ? (
              metadata.slug
            ) : (
              <div
                style={{
                  borderRadius: '8px',
                  padding: '6px',
                  backgroundColor: '#fde9ef'
                }}>
                {t('articleEditor.panels.addSlug')}
              </div>
            )}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.tags')}>
            {metadata.tags.join(', ') || '-'}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.breakingNews')}>
            {metadata.breaking ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.sharedWithPeers')}>
            {metadata.shared ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.hideAuthors')}>
            {metadata.hideAuthor ? t('articleEditor.panels.yes') : t('articleEditor.panels.no')}
          </DescriptionListItem>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishDate || !updateDate || !metadata.slug}
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
