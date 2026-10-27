import { ApolloClient, CombinedGraphQLErrors } from '@apollo/client';
import {
  NavigationListDocument,
  PeerProfileDocument,
  SettingListDocument,
  WebsiteSettingsDocument,
  WebsiteSettingsFragment,
} from '@wepublish/website/api';

/**
 * Isomorphic query helpers — safe to import from anywhere. Nothing in here
 * touches the request; that lives in
 * `@wepublish/utils/website/tanstack/server`.
 */

/**
 * Queries every page needs. Was duplicated in every `getStaticProps`.
 *
 * All four land in the Apollo cache and are dehydrated into the SSR payload;
 * the website settings are also returned, because the root loader renders
 * from them directly (theme, fonts, `head`) rather than reading them back
 * out.
 *
 * `SettingList` is global, anonymous and identical for every visitor — the
 * poll, comment and rating providers each read it. Fetching it here puts it
 * in the document payload instead of letting those components ask the API
 * from the browser on every first paint.
 */
export const prefetchShared = async (client: ApolloClient) => {
  const [settings] = await Promise.all([
    client.query({ query: WebsiteSettingsDocument }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
    client.query({ query: SettingListDocument }),
  ]);

  return settings.data?.websiteSettings as WebsiteSettingsFragment | undefined;
};

/**
 * The 404 detection Next's `getStaticProps` used, verbatim. The API answers
 * with a GraphQL error carrying `extensions.status === 404` rather than an
 * empty result, so a plain `!data` check is not equivalent.
 */
export const isNotFoundError = (error: unknown) =>
  CombinedGraphQLErrors.is(error) &&
  !!error.errors.find(({ extensions }) => extensions?.status === 404);
