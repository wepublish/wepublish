import { FourOhFourPage } from '../pages/404-page';
import {
  AuthorListPage,
  DEFAULT_AUTHOR_LIST_TAKE,
  prefetchAuthorList,
} from '../pages/author-list-page';
import { AuthorPage, prefetchAuthor } from '../pages/author-page';
import { isNotFoundError } from '../prefetch';
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
  loader: ({
    context: { apolloClient },
    deps: { page },
  }: {
    context: ApolloRouterContext;
    deps: { page?: number };
  }) => prefetchAuthorList(apolloClient, { page, take }),
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
    const { author, prefetchArticles } = await prefetchAuthor(
      context.apolloClient,
      { slug }
    );

    if (isNotFoundError(author.error)) {
      await bailOutNotFound(context);
    }

    await prefetchArticles();
  },
  component: AuthorPage,
  notFoundComponent: FourOhFourPage,
});
