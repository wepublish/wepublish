import { createFileRoute } from '@tanstack/react-router';
import { articleByIdRoute } from '@wepublish/utils/website/tanstack';

import { reflektArticlePageProps } from '../../../article-page-props';

/** `pages/a/id/[id].tsx` */
export const Route = createFileRoute('/a/id/$id')(
  articleByIdRoute(reflektArticlePageProps)
);
