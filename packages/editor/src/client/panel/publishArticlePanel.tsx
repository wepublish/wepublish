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

  const missingInfoStyle = {
    borderRadius: '8px',
    padding: '6px',
    backgroundColor: '#FFEBCD'
  }

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
            {metadata.title ? (
              metadata.title
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterTitle')}</div>
            )}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.lead')}>
            {metadata.lead || '-'}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.seoTitle')}>
            {metadata.seoTitle ? (
              metadata.seoTitle
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterSeoTitle')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.authors')}>
            {metadata.authors.length ? (
              metadata.authors.map(e => e.name).join(', ')
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterAuthors')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.slug')}>
            {metadata.slug || '-'}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.tags')}>
            {metadata.tags.length ? (
              metadata.tags.join(', ')
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterTag')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.image')}>
            {metadata.image ? (
              metadata.image.filename
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterImage')}</div>
            )}
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

          <DescriptionListItem label={t('articleEditor.panels.socialMediaTitle')}>
            {metadata.socialMediaTitle ? (
              metadata.socialMediaTitle
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterSocialMediaTitle')}</div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.socialMediaDescription')}>
            {metadata.socialMediaDescription ? (
              metadata.socialMediaDescription
            ) : (
              <div style={missingInfoStyle}>
                {t('articleEditor.panels.enterSocialMediaDescription')}
              </div>
            )}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.socialMediaAuthors')}>
            {metadata.socialMediaAuthors.length ? (
              metadata.socialMediaAuthors.map(e => e.name).join(', ')
            ) : (
              <div style={missingInfoStyle}>
                {t('articleEditor.panels.enterSocialMediaAuthors')}
              </div>
            )}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.socialMediaImage')}>
            {metadata.socialMediaImage ? (
              metadata.socialMediaImage.filename
            ) : (
              <div style={missingInfoStyle}>{t('articleEditor.panels.enterSocialMediaImage')}</div>
            )}
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
