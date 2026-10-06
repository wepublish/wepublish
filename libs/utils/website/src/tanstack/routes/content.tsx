import { PageContainer } from '@wepublish/page/website';
import { PageDocument, PageQuery } from '@wepublish/website/api';

import { FourOhFourPage } from '../pages/404-page';
import { isNotFoundError } from '../prefetch';
import { ApolloRouterContext, bailOutNotFound, useRouteParams } from './shared';

/** The home page: `pages/index.tsx`. */
export const homePageRoute = () => ({
  loader: ({ context: { apolloClient } }: { context: ApolloRouterContext }) =>
    apolloClient.query({ query: PageDocument, variables: { slug: '' } }),
  component: () => <PageContainer slug={''} />,
});

/** `pages/[slug].tsx` */
export const pageBySlugRoute = () => ({
  loader: async ({
    context,
    params: { slug },
  }: {
    context: ApolloRouterContext;
    params: { slug: string };
  }) => {
    const page = await context.apolloClient.query<PageQuery>({
      query: PageDocument,
      variables: { slug },
    });

    if (isNotFoundError(page.error)) {
      await bailOutNotFound(context);
    }
  },
  component: PageBySlug,
  notFoundComponent: FourOhFourPage,
});

/** `pages/id/[id].tsx` — the same page, addressed by id. */
export const pageByIdRoute = () => ({
  loader: async ({
    context,
    params: { id },
  }: {
    context: ApolloRouterContext;
    params: { id: string };
  }) => {
    const page = await context.apolloClient.query<PageQuery>({
      query: PageDocument,
      variables: { id },
    });

    if (isNotFoundError(page.error)) {
      await bailOutNotFound(context);
    }
  },
  component: PageById,
  notFoundComponent: FourOhFourPage,
});

function PageBySlug() {
  const { slug } = useRouteParams<{ slug: string }>();

  return <PageContainer slug={slug} />;
}

function PageById() {
  const { id } = useRouteParams<{ id: string }>();

  return <PageContainer id={id} />;
}
