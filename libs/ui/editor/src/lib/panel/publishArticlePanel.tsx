import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Message, Modal } from 'rsuite';

import {
  createCheckedPermissionComponent,
  DateTimePicker,
  DescriptionList,
  DescriptionListItem,
  DescriptionListItemWithMessage,
  InfoColor,
} from '../atoms';
import { ArticleMetadata } from './articleMetadataPanel';

export interface PublishArticlePanelProps {
  publishedAtDate?: Date;
  metadata: ArticleMetadata;

  onClose(): void;
  onConfirm(publishedAt: Date): void;
}

function PublishArticlePanel({
  publishedAtDate,
  metadata,
  onClose,
  onConfirm,
}: PublishArticlePanelProps) {
  const now = new Date();
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(
    publishedAtDate ?? now
  );
  const { t } = useTranslation();

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('articleEditor.panels.publishArticle')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {publishedAt && publishedAt > now && (
          <Message type="warning">
            {t('articleEditor.panels.articlePending', {
              pendingPublishDate: publishedAt,
            })}
          </Message>
        )}

        <div style={{ maxWidth: '200px' }}>
          <DateTimePicker
            dateTime={publishedAt}
            label={t('articleEditor.panels.publishDate')}
            changeDate={date => setPublishedAt(date)}
          />
        </div>

        <DescriptionList>
          <DescriptionListItem label={t('articleEditor.panels.url')}>
            {metadata?.url ?
              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {metadata.url}
              </a>
            : '-'}
          </DescriptionListItem>

          <DescriptionListItem label={t('articleEditor.panels.preTitle')}>
            {metadata.preTitle || '-'}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.title')}
            message={t('articleEditor.panels.enterTitle')}
            messageType={InfoColor.warning}
          >
            {metadata.title}
          </DescriptionListItemWithMessage>

          <DescriptionListItem label={t('articleEditor.panels.lead')}>
            {metadata.lead || '-'}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.seoTitle')}
            message={t('articleEditor.panels.enterSeoTitle')}
            messageType={InfoColor.warning}
          >
            {metadata.seoTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.authors')}
            message={t('articleEditor.panels.enterAuthors')}
            messageType={InfoColor.warning}
          >
            {metadata.authors.map(e => e.name).join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.slug')}
            message={t('articleEditor.panels.addSlug')}
            messageType={InfoColor.error}
          >
            {metadata.slug}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.tags')}
            message={t('articleEditor.panels.enterTag')}
            messageType={InfoColor.warning}
          >
            {metadata.tags.join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.image')}
            message={t('articleEditor.panels.enterImage')}
            messageType={InfoColor.warning}
          >
            {metadata.image?.filename}
          </DescriptionListItemWithMessage>

          <DescriptionListItem label={t('articleEditor.panels.breakingNews')}>
            {metadata.breaking ?
              t('articleEditor.panels.yes')
            : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem
            label={t('articleEditor.panels.sharedWithPeers')}
          >
            {metadata.shared ?
              t('articleEditor.panels.yes')
            : t('articleEditor.panels.no')}
          </DescriptionListItem>
          <DescriptionListItem label={t('articleEditor.panels.hideAuthors')}>
            {metadata.hideAuthor ?
              t('articleEditor.panels.yes')
            : t('articleEditor.panels.no')}
          </DescriptionListItem>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaTitle')}
            message={t('articleEditor.panels.enterSocialMediaTitle')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaDescription')}
            message={t('articleEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaDescription}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaAuthors')}
            message={t('articleEditor.panels.enterSocialMediaAuthors')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaAuthors.map(e => e.name).join(', ')}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('articleEditor.panels.socialMediaImage')}
            message={t('articleEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaImage?.filename}
          </DescriptionListItemWithMessage>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishedAt || !metadata.slug}
          onClick={() => onConfirm(publishedAt!)}
        >
          {t('articleEditor.panels.confirm')}
        </Button>
        <Button
          appearance="subtle"
          onClick={() => onClose()}
        >
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_PUBLISH_ARTICLE',
])(PublishArticlePanel);
export { CheckedPermissionComponent as PublishArticlePanel };
