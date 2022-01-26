import React, {useState} from 'react'

import {ArticleMetadata} from './articleMetadataPanel'

import {useTranslation} from 'react-i18next'
import {Button, Icon, IconButton, Message, Modal, Panel, Popover, Whisper} from 'rsuite'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {DescriptionListItemWithMessage} from '../atoms/descriptionListwithMessage'

import {DateTimePicker} from '../atoms/dateTimePicker'
import {InfoColor} from '../atoms/infoMessage'

export interface PublishArticlePanelProps {
  publishedAtDate?: Date
  updatedAtDate?: Date
  publishAtDate?: Date
  pendingPublishDate?: Date
  metadata: ArticleMetadata

  onClose(): void
  onConfirm(publishedAt: Date, updatedAt: Date, publishAt: Date): void
}

export function PublishArticlePanel({
  publishedAtDate,
  updatedAtDate,
  publishAtDate,
  pendingPublishDate,
  metadata,
  onClose,
  onConfirm
}: PublishArticlePanelProps) {
  const now = new Date()

  const [publishedAt, setPublishedAt] = useState<Date | undefined>(publishedAtDate ?? now)

  const [publishAt, setpublishAt] = useState<Date | undefined>(publishAtDate ?? undefined)

  const [updatedAt, setupdatedAt] = useState<Date | undefined>(updatedAtDate ?? now)

  // If updatedAt is older that publishedAt, set it to publishedAt
  // If there is a date and the user doesn’t change it, leave it to what it was

  // updatedAt can't be older than publishedAT
  // should stay as initial value if user doens't change it

  // useEffect(() => {
  //   if (updatedAt && publishedAt && updatedAt < publishedAt)
  //   console.log('updateAt cannot be older thant publication date')
  //   // setupdatedAt(publishedAt)
  // }, [publishedAt, updatedAt])

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
          dateTime={publishedAt}
          label={t('articleEditor.panels.publishDate')}
          changeDate={date => setPublishedAt(date)}
        />
        <DateTimePicker
          dateTime={updatedAt}
          label={t('articleEditor.panels.updateDate')}
          changeDate={date => setupdatedAt(date)}
        />
        {updatedAt && publishedAt && updatedAt < publishedAt ? (
          <Message
            type="warning"
            description={t('articleEditor.panels.updateDateWarning')}></Message>
        ) : (
          ''
        )}
        <Panel
          header={t('articleEditor.panels.advancedOptions')}
          collapsible
          className="availableFromPublishPanel">
          <div style={{display: 'flex', flexDirection: 'row'}}>
            <div>
              <DateTimePicker
                dateTime={publishAt}
                label={t('articleEditor.panels.publishAt')}
                changeDate={date => setpublishAt(date)}
              />
            </div>
            <Whisper
              placement="right"
              trigger="hover"
              controlId="control-id-hover"
              speaker={
                <Popover>
                  <p>{t('articleEditor.panels.dateExplanationPopOver')} </p>
                </Popover>
              }>
              <IconButton
                icon={<Icon icon="info" />}
                circle
                size="xs"
                style={{marginTop: 35, marginLeft: 10}}></IconButton>
            </Whisper>
          </div>
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
          disabled={!publishedAt || !updatedAt || !metadata.slug || updatedAt < publishedAt}
          onClick={() => onConfirm(publishedAt!, updatedAt!, publishAt!)}>
          {t('articleEditor.panels.confirm')}
        </Button>

        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
