import { createFileRoute } from '@tanstack/react-router';
import { articleBySlugRoute } from '@wepublish/utils/website/tanstack';

/** `pages/a/[slug].tsx` */
// `EenewsArticle` renders related articles and comments inside its own
// layout; keep the shared page from adding a second, full-width copy.
export const Route = createFileRoute('/a/$slug')(
  articleBySlugRoute({ relatedTitle: null, commentsTitle: null })
);
