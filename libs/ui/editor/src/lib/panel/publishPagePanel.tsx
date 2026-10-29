import { CanPublishPage } from '@wepublish/permissions';
import { useTranslation } from 'react-i18next';

import { createCheckedPermissionComponent } from '../atoms';
import { PageMetadata } from './pageMetadataPanel';
import { PublishDialogContent } from './publishDialogContent';

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
  const { t } = useTranslation();

  return (
    <PublishDialogContent
      title={t('pageEditor.panels.publishPage')}
      url={metadata.url}
      publishedAtDate={publishedAtDate}
      dateLabel={t('pageEditor.panels.publishDate')}
      pendingMessage={pendingPublishDate =>
        t('pageEditor.panels.pagePending', { pendingPublishDate })
      }
      closeLabel={t('pageEditor.panels.close')}
      onClose={onClose}
      onConfirm={onConfirm}
      checks={[
        {
          label: t('pageEditor.panels.title'),
          value: metadata.title,
          missing: t('pageEditor.panels.enterTitle'),
        },
        {
          label: t('pageEditor.panels.description'),
          value: metadata.description,
          missing: t('pageEditor.panels.enterDescription'),
        },
        {
          label: t('pageEditor.panels.seoTitle'),
          value: metadata.seoTitle,
        },
        {
          label: t('pageEditor.panels.seoDescription'),
          value: metadata.seoDescription,
        },
        {
          label: t('pageEditor.panels.slug'),
          value: metadata.slug,
        },
        {
          label: t('pageEditor.panels.tags'),
          value: metadata.tags.join(', '),
        },
        {
          label: t('pageEditor.panels.image'),
          value: metadata.image?.filename,
          missing: t('pageEditor.panels.enterImage'),
        },
        {
          label: t('pageEditor.panels.socialMediaTitle'),
          value: metadata.socialMediaTitle,
          missing: t('pageEditor.panels.enterSocialMediaTitle'),
        },
        {
          label: t('pageEditor.panels.socialMediaDescription'),
          value: metadata.socialMediaDescription,
          missing: t('pageEditor.panels.enterSocialMediaDescription'),
        },
        {
          label: t('pageEditor.panels.socialMediaImage'),
          value: metadata.socialMediaImage?.filename,
          missing: t('pageEditor.panels.enterSocialMediaImage'),
        },
      ]}
    />
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanPublishPage.id,
])(PublishPagePanel);
export { CheckedPermissionComponent as PublishPagePanel };
