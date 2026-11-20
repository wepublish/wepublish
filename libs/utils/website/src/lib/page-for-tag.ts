import { ApolloClient } from '@apollo/client';
import { PageDocument, PageQuery } from '@wepublish/website/api';

import { getPageShell, WebsiteShell } from './website-shell';

/**
 * An editor can pick a page that the tag's url shows instead of the tag's
 * article list (`TagContainer` renders it). Loads that page so it is part of
 * the server render, and returns the query result (what the route's cache
 * window should follow) and the shell the page asks for. `null` when the tag
 * shows its articles, which the caller then loads itself.
 */
export const prefetchPageForTag = async (
  client: ApolloClient,
  { pageId }: { pageId?: string | null }
): Promise<{
  page: ApolloClient.QueryResult<PageQuery>;
  shell: WebsiteShell;
} | null> => {
  if (!pageId) {
    return null;
  }

  const page = await client.query<PageQuery>({
    query: PageDocument,
    variables: { id: pageId },
  });

  return { page, shell: getPageShell(page.data?.page) };
};
