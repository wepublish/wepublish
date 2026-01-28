import React, { useState } from 'react';
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
import { PageMetadata } from './pageMetadataPanel';

export interface PublishPagePanelProps {
  publishedAtDate?: Date;
  metadata: PageMetadata;

  onClose(): void;
  onConfirm(publishedAt: Date): void;
}

function PublishPagePanel({
  publishedAtDate,
  metadata,
  onClose,
  onConfirm,
}: PublishPagePanelProps) {
  const now = new Date();
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(
    publishedAtDate ?? now
  );
  const { t } = useTranslation();

  return (
    <>
      <Modal.Header>
        <Modal.Title>{t('pageEditor.panels.publishPage')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {publishedAt && publishedAt > now && (
          <Message type="warning">
            {t('pageEditor.panels.pagePending', {
              pendingPublishDate: publishedAt,
            })}
          </Message>
        )}

        <div style={{ maxWidth: '200px' }}>
          <DateTimePicker
            dateTime={publishedAt}
            label={t('pageEditor.panels.publishDate')}
            changeDate={date => setPublishedAt(date)}
          />
        </div>

        <DescriptionList>
          <DescriptionListItem label={t('pageEditor.panels.url')}>
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
          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.title')}
            message={t('pageEditor.panels.enterTitle')}
            messageType={InfoColor.warning}
          >
            {metadata.title}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.description')}
            message={t('pageEditor.panels.enterDescription')}
            messageType={InfoColor.warning}
          >
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
            messageType={InfoColor.warning}
          >
            {metadata.image?.filename}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaTitle')}
            message={t('pageEditor.panels.enterSocialMediaTitle')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaTitle}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaDescription')}
            message={t('pageEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaDescription}
          </DescriptionListItemWithMessage>

          <DescriptionListItemWithMessage
            label={t('pageEditor.panels.socialMediaImage')}
            message={t('pageEditor.panels.enterSocialMediaDescription')}
            messageType={InfoColor.warning}
          >
            {metadata.socialMediaImage?.filename}
          </DescriptionListItemWithMessage>
        </DescriptionList>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={!publishedAt}
          onClick={() => onConfirm(publishedAt!)}
        >
          {t('pageEditor.panels.confirm')}
        </Button>
        <Button
          appearance="subtle"
          onClick={() => onClose()}
        >
          {t('pageEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_PUBLISH_PAGE',
])(PublishPagePanel);
export { CheckedPermissionComponent as PublishPagePanel };
