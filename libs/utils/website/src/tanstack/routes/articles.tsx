import { FourOhFourPage } from '../pages/404-page';
import {
  ArticleListPage,
  DEFAULT_ARTICLE_LIST_TAKE,
  prefetchArticleList,
} from '../pages/article-list-page';
import {
  ArticlePage,
  ArticlePageProps,
  prefetchArticle,
  prefetchArticleExtras,
} from '../pages/article-page';
import { prefetchTag, TagPage } from '../pages/tag-page';
import { isNotFoundError } from '../prefetch';
import {
  ApolloRouterContext,
  bailOutNotFound,
  pageSearchSchema,
} from './shared';

/** `pages/a/index.tsx` */
export const articleListRoute = ({
  take = DEFAULT_ARTICLE_LIST_TAKE,
  canonicalUrl = '/a',
}: { take?: number; canonicalUrl?: string } = {}) => ({
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search: { page } }: { search: { page?: number } }) => ({
    page,
  }),
  loader: ({
    context: { apolloClient },
    deps: { page },
  }: {
    context: ApolloRouterContext;
    deps: { page?: number };
  }) => prefetchArticleList(apolloClient, { page, take }),
  component: () => (
    <ArticleListPage
      take={take}
      canonicalUrl={canonicalUrl}
    />
  ),
});

const articleRouteFor =
  (by: 'slug' | 'id') =>
  (props: ArticlePageProps = {}) => ({
    loader: async ({
      context,
      params,
    }: {
      context: ApolloRouterContext;
      params: Record<string, string>;
    }) => {
      const article = await prefetchArticle(context.apolloClient, {
        [by]: params[by],
      });

      if (isNotFoundError(article.error)) {
        await bailOutNotFound(context);
      }

      await prefetchArticleExtras(context.apolloClient, article.data?.article, {
        relatedTake: props.relatedTake,
      });
    },
    component: () => <ArticlePage {...props} />,
    notFoundComponent: FourOhFourPage,
  });

/** `pages/a/[slug].tsx` */
export const articleBySlugRoute = articleRouteFor('slug');

/** `pages/a/id/[id].tsx` */
export const articleByIdRoute = articleRouteFor('id');

/** `pages/a/tag/[tag].tsx` */
export const tagRoute = () => ({
  validateSearch: pageSearchSchema,
  loader: async ({
    context,
    params: { tag },
  }: {
    context: ApolloRouterContext;
    params: { tag: string };
  }) => {
    const found = await prefetchTag(context.apolloClient, { tag });

    if (!found) {
      await bailOutNotFound(context);
    }
  },
  component: TagPage,
  notFoundComponent: FourOhFourPage,
});
