import { ApolloClient, CombinedGraphQLErrors } from '@apollo/client';
import {
  NavigationListDocument,
  PeerProfileDocument,
  WebsiteSettingsDocument,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';

/**
 * Isomorphic query helpers — safe to import from anywhere. Nothing in here
 * touches the request; that lives in
 * `@wepublish/utils/website/tanstack/server`.
 */

/** Queries every page needs. Was duplicated in every `getStaticProps`. */
export const prefetchShared = async (client: ApolloClient) => {
  await Promise.all([
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);
};

export const prefetchWebsiteSettings = async (client: ApolloClient) => {
  const { data } = await client.query({ query: WebsiteSettingsDocument });

  return data?.websiteSettings as WebsiteSettingsFragment | undefined;
};

/**
 * The 404 detection Next's `getStaticProps` used, verbatim. The API answers
 * with a GraphQL error carrying `extensions.status === 404` rather than an
 * empty result, so a plain `!data` check is not equivalent.
 */
export const isNotFoundError = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  !!error.errors.find(({ extensions }) => extensions?.status === 404);
