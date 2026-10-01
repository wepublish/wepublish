// The single page component of the live site: "/" and "/[slug]" both render
// the home overview, and a slug additionally renders its route into the
// overlay (bundle module Ritt, default export).
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';

import { getApolloClient } from '../lib/apollo';
import { RouterQuery } from '../lib/queries';
import { RouteResolver, SiteLayout } from './pages';

export default function SitePage() {
  const { search, slug } = useRouter().query;
  const url = `/${slug}`;
  const { loading, error, data } = useQuery(RouterQuery, {
    variables: { path: url },
  });

  const overlay = slug && (
    <RouteResolver
      queryString={search || ''}
      url={url}
      loading={loading}
      error={error}
      data={data}
    />
  );

  return <SiteLayout overlay={overlay} />;
}

// pages/_app.tsx renders these pages in the legacy shell instead of the
// we.publish layout
SitePage.legacyLayout = true;

// like the live site's `withApollo({ssr: true})`: prefetch every query of the
// tree on the server so the first paint is complete
SitePage.getInitialProps = async ({ AppTree, query, res }) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const apolloClient = getApolloClient();
  const { getDataFromTree } = await import('@apollo/client/react/ssr');

  try {
    await getDataFromTree(<AppTree pageProps={{ apolloClient }} />);
  } catch (error) {
    console.error('Error while running `getDataFromTree`', error);
  }

  // the overlay shows "404 – Seite wurde nicht gefunden" for an unknown slug;
  // answer with the matching status (the live site answers 200)
  if (query.slug && res) {
    const route = apolloClient.readQuery({
      query: RouterQuery,
      variables: { path: `/${query.slug}` },
    });

    if (route && !route.route?.entity) {
      res.statusCode = 404;
    }
  }

  return { apolloState: apolloClient.cache.extract() };
};
