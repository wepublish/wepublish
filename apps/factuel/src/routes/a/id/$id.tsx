import { createFileRoute } from '@tanstack/react-router';
import { articleByIdRoute } from '@wepublish/utils/website/tanstack';

import { FactuelArticlePage } from '../../../integration/article-page';

/** `pages/a/id/[id].tsx` */
export const Route = createFileRoute('/a/id/$id')({
  ...articleByIdRoute(),
  component: FactuelArticlePage,
});
