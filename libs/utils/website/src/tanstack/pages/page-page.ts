import { createServerFn } from '@tanstack/react-start';
import { PageDocument, PageQuery } from '@wepublish/website/api';

import { getPageShell, WebsiteShell } from '../../lib/website-shell';
import { runContentQueries } from '../ssr';
import { isNotFoundError } from '../prefetch';

export type PageIdentifier = { slug?: string; id?: string };

/**
 * The server-side half of every CMS page route's loader — home, `/[slug]` and
 * `/id/[id]`. See `runContentQueries` for why content goes through a server
 * function rather than querying the router's client directly.
 */
export const loadPage = createServerFn({ method: 'GET' })
  .validator((data: PageIdentifier) => data)
  .handler(async ({ data }) => {
    let notFound = false;
    let shell: WebsiteShell | undefined;

    const apollo = await runContentQueries(async client => {
      const page = await client.query<PageQuery>({
        query: PageDocument,
        variables: data,
      });

      notFound = isNotFoundError(page.error);
      shell = getPageShell(page.data?.page);
    });

    return { apollo, notFound, shell };
  });
