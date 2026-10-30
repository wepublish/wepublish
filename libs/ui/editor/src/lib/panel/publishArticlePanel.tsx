import { CanPublishArticle } from '@wepublish/permissions';
import { useTranslation } from 'react-i18next';

import { createCheckedPermissionComponent } from '../atoms';
import { formatArticleAuthors } from './articleAuthorList';
import { ArticleMetadata } from './articleMetadataPanel';
import { PublishDialogContent } from './publishDialogContent';

export interface PublishArticlePanelProps {
  publishedAtDate?: Date;
  firstPublishedAtDate?: Date;
  metadata: ArticleMetadata;

  onClose(): void;
  onConfirm(publishedAt: Date): void;
}

function PublishArticlePanel({
  publishedAtDate,
  firstPublishedAtDate,
  metadata,
  onClose,
  onConfirm,
}: PublishArticlePanelProps) {
  const { t } = useTranslation();

  return (
    <PublishDialogContent
      title={t('articleEditor.panels.publishArticle')}
      url={metadata.url}
      publishedAtDate={publishedAtDate}
      dateLabel={t('articleEditor.panels.publishDate')}
      dateHelperText={
        firstPublishedAtDate ?
          t('articleEditor.panels.firstPublishedAtDate', {
            firstPublishedAtDate,
          })
        : t('articleEditor.panels.notPublishedYet')
      }
      pendingMessage={pendingPublishDate =>
        t('articleEditor.panels.articlePending', { pendingPublishDate })
      }
      closeLabel={t('articleEditor.panels.close')}
      onClose={onClose}
      onConfirm={onConfirm}
      options={[
        metadata.breaking && t('articleEditor.panels.breakingNews'),
        metadata.shared && t('articleEditor.panels.sharedWithPeers'),
        metadata.hideAuthor && t('articleEditor.panels.hideAuthors'),
      ].filter((option): option is string => !!option)}
      checks={[
        {
          label: t('articleEditor.panels.slug'),
          value: metadata.slug,
          missing: t('articleEditor.panels.addSlug'),
          required: true,
        },
        {
          label: t('articleEditor.panels.preTitle'),
          value: metadata.preTitle,
        },
        {
          label: t('articleEditor.panels.title'),
          value: metadata.title,
          missing: t('articleEditor.panels.enterTitle'),
        },
        {
          label: t('articleEditor.panels.lead'),
          value: metadata.lead,
        },
        {
          label: t('articleEditor.panels.authors'),
          value: formatArticleAuthors(metadata.authors),
          missing: t('articleEditor.panels.enterAuthors'),
        },
        {
          label: t('articleEditor.panels.tags'),
          value: metadata.tags.join(', '),
          missing: t('articleEditor.panels.enterTag'),
        },
        {
          label: t('articleEditor.panels.image'),
          value: metadata.image?.filename,
          missing: t('articleEditor.panels.enterImage'),
        },
        {
          label: t('articleEditor.panels.seoTitle'),
          value: metadata.seoTitle,
          missing: t('articleEditor.panels.enterSeoTitle'),
        },
        {
          label: t('articleEditor.panels.seoDescription'),
          value: metadata.seoDescription,
        },
        {
          label: t('articleEditor.panels.socialMediaTitle'),
          value: metadata.socialMediaTitle,
          missing: t('articleEditor.panels.enterSocialMediaTitle'),
        },
        {
          label: t('articleEditor.panels.socialMediaDescription'),
          value: metadata.socialMediaDescription,
          missing: t('articleEditor.panels.enterSocialMediaDescription'),
        },
        {
          label: t('articleEditor.panels.socialMediaAuthors'),
          value: metadata.socialMediaAuthors.map(e => e.name).join(', '),
          missing: t('articleEditor.panels.enterSocialMediaAuthors'),
        },
        {
          label: t('articleEditor.panels.socialMediaImage'),
          value: metadata.socialMediaImage?.filename,
          missing: t('articleEditor.panels.enterSocialMediaImage'),
        },
      ]}
    />
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanPublishArticle.id,
])(PublishArticlePanel);
export { CheckedPermissionComponent as PublishArticlePanel };
