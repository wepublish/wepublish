import { ArticlePage } from '@wepublish/utils/website/tanstack';
import { useTranslation } from 'react-i18next';

/**
 * The Next `pages/a/[slug].tsx` read both headings from the translations —
 * factuel is a French site, and the shared page defaults to German copy.
 */
export function FactuelArticlePage() {
  const { t } = useTranslation();

  return (
    <ArticlePage
      relatedTitle={t('article.related')}
      commentsTitle={t('article.comments')}
    />
  );
}
