import { FourOhFourPage } from '../pages/404-page';
import {
  ArticleListPage,
  DEFAULT_ARTICLE_LIST_TAKE,
  loadArticleList,
} from '../pages/article-list-page';
import { mergeApolloCache } from '../apollo';
import {
  ArticlePage,
  ArticlePageProps,
  loadArticle,
} from '../pages/article-page';
import { loadTag, TagPage } from '../pages/tag-page';
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
  loader: async ({
    context: { apolloClient },
    deps: { page },
  }: {
    context: ApolloRouterContext;
    deps: { page?: number };
  }) => {
    const { apollo } = await loadArticleList({ data: { page, take } });

    mergeApolloCache(apolloClient, apollo);
  },
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
      const { apollo, notFound } = await loadArticle({
        data: { [by]: params[by], relatedTake: props.relatedTake },
      });

      mergeApolloCache(context.apolloClient, apollo);

      if (notFound) {
        await bailOutNotFound(context);
      }
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
    const { apollo, found } = await loadTag({ data: { tag } });

    mergeApolloCache(context.apolloClient, apollo);

    if (!found) {
      await bailOutNotFound(context);
    }
  },
  component: TagPage,
  notFoundComponent: FourOhFourPage,
});
