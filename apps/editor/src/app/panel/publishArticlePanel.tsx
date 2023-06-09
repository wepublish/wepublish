import {
  createCheckedPermissionComponent,
  DateTimePicker,
  DescriptionList,
  DescriptionListItem,
  DescriptionListItemWithMessage,
  InfoColor
} from '@wepublish/ui/editor'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Checkbox, Message, Modal} from 'rsuite'

import {ArticleMetadata} from './articleMetadataPanel'

export interface PublishArticlePanelProps {
  publishedAtDate?: Date
  updatedAtDate?: Date
  publishAtDate?: Date
  pendingPublishDate?: Date
  metadata: ArticleMetadata

  onClose(): void
  onConfirm(publishedAt: Date, publishAt: Date, updatedAt?: Date): void
}

function PublishArticlePanel({
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

  const [publishAt, setPublishAt] = useState<Date | undefined>(publishAtDate ?? undefined)

  const [updatedAt, setUpdatedAt] = useState<Date | undefined>(
    updatedAtDate?.getTime() === publishedAtDate?.getTime() ? undefined : updatedAtDate
  )

  const [isPublishDateActive, setIsPublishDateActive] = useState<boolean>(
    !(publishedAt?.getTime() === publishAt?.getTime() || !publishAt) ?? false
  )
  const {t} = useTranslation()

  useEffect(() => {
    if (!publishAt || !isPublishDateActive) {
      setPublishAt(publishedAt)
    }
  }, [isPublishDateActive, publishedAt])

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('articleEditor.panels.publishArticle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {pendingPublishDate && (
          <Message type="warning">
            {t('articleEditor.panels.articlePending', {
              pendingPublishDate
            })}
          </Message>
        )}

        <div style={{maxWidth: '200px'}}>
          <DateTimePicker
            dateTime={publishedAt}
            label={t('articleEditor.panels.publishDate')}
            changeDate={date => setPublishedAt(date)}
          />
        </div>

        <div style={{maxWidth: '200px'}}>
          <DateTimePicker
            dateTime={updatedAt}
            label={t('articleEditor.panels.updateDate')}
            changeDate={date => setUpdatedAt(date)}
          />
        </div>

        {updatedAt && publishedAt && updatedAt < publishedAt ? (
          <Message type="warning">{t('articleEditor.panels.updateDateWarning')}</Message>
        ) : (
          ''
        )}

        <Checkbox
          checked={isPublishDateActive}
          onChange={(_, checked) => {
            setIsPublishDateActive(checked)
          }}>
          {t('articleEditor.panels.publishAtDateCheckbox')}
        </Checkbox>

        {isPublishDateActive ? (
          <div style={{maxWidth: '200px'}}>
            <DateTimePicker
              dateTime={publishAt}
              label={t('articleEditor.panels.publishAt')}
              changeDate={date => setPublishAt(date)}
              helpInfo={t('articleEditor.panels.dateExplanationPopOver')}
            />
          </div>
        ) : (
          ''
        )}

        <DescriptionList>
          <DescriptionListItem label={t('articleEditor.panels.url')}>
            {metadata?.url ? (
              <a href={metadata.url} target="_blank" rel="noopener noreferrer">
                {metadata.url}
              </a>
            ) : (
              '-'
            )}
          </DescriptionListItem>

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
          disabled={!publishedAt || !metadata.slug || (updatedAt && updatedAt < publishedAt)}
          onClick={() => onConfirm(publishedAt!, publishAt!, updatedAt)}>
          {t('articleEditor.panels.confirm')}
        </Button>
        <Button appearance="subtle" onClick={() => onClose()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent(['CAN_PUBLISH_ARTICLE'])(
  PublishArticlePanel
)
export {CheckedPermissionComponent as PublishArticlePanel}
