import { PageContainer } from '@wepublish/page/website';
import { getPageShell } from '../../lib/website-shell';
import { PageDocument, PageQuery } from '@wepublish/website/api';

import { FourOhFourPage } from '../pages/404-page';
import { isNotFoundError } from '../prefetch';
import { ApolloRouterContext, bailOutNotFound, useRouteParams } from './shared';

/** The home page: `pages/index.tsx`. */
export const homePageRoute = () => ({
  loader: async ({
    context: { apolloClient },
  }: {
    context: ApolloRouterContext;
  }) => {
    const page = await apolloClient.query<PageQuery>({
      query: PageDocument,
      variables: { slug: '' },
    });

    return { shell: getPageShell(page.data?.page) };
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
    const page = await context.apolloClient.query<PageQuery>({
      query: PageDocument,
      variables: { slug },
    });

    if (isNotFoundError(page.error)) {
      await bailOutNotFound(context);
    }

    return { shell: getPageShell(page.data?.page) };
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

    return { shell: getPageShell(page.data?.page) };
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
