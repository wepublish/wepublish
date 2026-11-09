import { createFileRoute } from '@tanstack/react-router';
import { articleBySlugRoute } from '@wepublish/utils/website/tanstack';

import { FactuelArticlePage } from '../../integration/article-page';

/** `pages/a/[slug].tsx` */
export const Route = createFileRoute('/a/$slug')({
  ...articleBySlugRoute(),
  component: FactuelArticlePage,
});
