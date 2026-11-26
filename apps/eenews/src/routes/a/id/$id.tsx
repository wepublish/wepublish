import { createFileRoute } from '@tanstack/react-router';
import { articleByIdRoute } from '@wepublish/utils/website/tanstack';

/** `pages/a/id/[id].tsx` */
// `EenewsArticle` renders related articles and comments inside its own
// layout; keep the shared page from adding a second, full-width copy.
export const Route = createFileRoute('/a/id/$id')(
  articleByIdRoute({ relatedTitle: null, commentsTitle: null })
);
