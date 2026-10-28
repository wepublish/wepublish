import { PageContainer } from '@wepublish/page/website';

import { mergeApolloCache } from '../apollo';
import { FourOhFourPage } from '../pages/404-page';
import { loadPage } from '../pages/page-page';
import { ApolloRouterContext, bailOutNotFound, useRouteParams } from './shared';

/** The home page: `pages/index.tsx`. */
export const homePageRoute = () => ({
  loader: async ({
    context: { apolloClient },
  }: {
    context: ApolloRouterContext;
  }) => {
    const { apollo, shell } = await loadPage({ data: { slug: '' } });

    mergeApolloCache(apolloClient, apollo);

    return { shell };
  },
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
    const { apollo, notFound, shell } = await loadPage({
      data: { slug },
    });

    mergeApolloCache(context.apolloClient, apollo);

    if (notFound) {
      await bailOutNotFound(context);
    }

    return { shell };
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
    const { apollo, notFound, shell } = await loadPage({
      data: { id },
    });

    mergeApolloCache(context.apolloClient, apollo);

    if (notFound) {
      await bailOutNotFound(context);
    }

    return { shell };
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
