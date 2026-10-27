import { mergeApolloCache } from '../apollo';
import { FourOhFourPage } from '../pages/404-page';
import {
  AuthorListPage,
  DEFAULT_AUTHOR_LIST_TAKE,
  loadAuthorList,
} from '../pages/author-list-page';
import { AuthorPage, loadAuthor } from '../pages/author-page';
import {
  ApolloRouterContext,
  bailOutNotFound,
  pageSearchSchema,
} from './shared';

/** `pages/author/index.tsx` */
export const authorListRoute = ({
  take = DEFAULT_AUTHOR_LIST_TAKE,
  canonicalUrl = '/author',
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
    const { apollo } = await loadAuthorList({ data: { page, take } });

    mergeApolloCache(apolloClient, apollo);
  },
  component: () => (
    <AuthorListPage
      take={take}
      canonicalUrl={canonicalUrl}
    />
  ),
});

/** `pages/author/[slug].tsx` */
export const authorRoute = () => ({
  validateSearch: pageSearchSchema,
  loader: async ({
    context,
    params: { slug },
  }: {
    context: ApolloRouterContext;
    params: { slug: string };
  }) => {
    const { apollo, notFound } = await loadAuthor({ data: { slug } });

    mergeApolloCache(context.apolloClient, apollo);

    if (notFound) {
      await bailOutNotFound(context);
    }
  },
  component: AuthorPage,
  notFoundComponent: FourOhFourPage,
});
