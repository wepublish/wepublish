import { createServerFn } from '@tanstack/react-start';
import { resolveWhitelistTagIds } from '@wepublish/tenant/eenews';
import { runContentQueries } from '@wepublish/utils/website/tanstack/server';
import {
  ArticleListDocument,
  TagDocument,
  TagListDocument,
  TagListQuery,
  TagType,
} from '@wepublish/website/api';

export const TAG_TAKE = 25;
export const DOSSIER_TAKE = 24;

/**
 * Server-side half of `/a/tag/$tag`.
 *
 * The shared `tagRoute()` would do the first two queries, but not the third:
 * a **main** tag renders a row of chips, one per whitelisted tag, each
 * counting the articles it shares with the current tag. `getStaticProps`
 * primed those counts so the chips render with the first paint; without the
 * prefetch they would each fire their own request from the browser.
 */
export const loadEenewsTag = createServerFn({ method: 'GET' })
  .validator((data: { tag: string }) => data)
  .handler(async ({ data }) => {
    let found = false;

    const apollo = await runContentQueries(async client => {
      const tagResult = await client.query({
        query: TagDocument,
        variables: { tag: data.tag, type: TagType.Article },
      });

      if (tagResult.error || !tagResult.data?.tag) {
        return tagResult;
      }

      found = true;

      const tagId = tagResult.data.tag.id;

      await client.query({
        query: ArticleListDocument,
        variables: { take: TAG_TAKE, skip: 0, filter: { tags: [tagId] } },
      });

      if (tagResult.data.tag.main) {
        const tagList = await client.query<TagListQuery>({
          query: TagListDocument,
          variables: { take: 100 },
        });

        await Promise.all(
          resolveWhitelistTagIds(tagList.data?.tags?.nodes ?? []).map(
            chipTagId =>
              client.query({
                query: ArticleListDocument,
                variables: {
                  take: 1,
                  skip: 0,
                  filter: { allTagsIn: [tagId, chipTagId] },
                },
              })
          )
        );
      }

      return tagResult;
    });

    return { apollo, found };
  });

/**
 * Server-side half of `/a/tag` — the dossier index, which has no tag of its
 * own and lists the articles carrying any whitelisted tag.
 */
export const loadEenewsDossierIndex = createServerFn({ method: 'GET' })
  .validator((data: { page?: number }) => data)
  .handler(async ({ data }) => {
    let whitelistTagIds: string[] = [];

    const apollo = await runContentQueries(async client => {
      const tagList = await client.query<TagListQuery>({
        query: TagListDocument,
        variables: { take: 100 },
      });

      whitelistTagIds = resolveWhitelistTagIds(tagList.data?.tags?.nodes ?? []);

      return client.query({
        query: ArticleListDocument,
        variables: {
          take: DOSSIER_TAKE,
          skip: ((data.page ?? 1) - 1) * DOSSIER_TAKE,
          filter:
            whitelistTagIds.length ? { tags: whitelistTagIds } : undefined,
        },
      });
    });

    return { apollo, whitelistTagIds };
  });
