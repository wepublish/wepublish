import { createFileRoute } from '@tanstack/react-router';
import { articleBySlugRoute } from '@wepublish/utils/website/tanstack';

import { reflektArticlePageProps } from '../../article-page-props';

/** `pages/a/[slug].tsx` */
export const Route = createFileRoute('/a/$slug')(
  articleBySlugRoute(reflektArticlePageProps)
);
