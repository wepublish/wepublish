import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  TagDocument,
  TagListDocument,
  TagListQuery,
  TagQuery,
  TagType,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';

import { resolveWhitelistTagIds } from '../../../src/components/teasers/eenews-teaser-selectors';

export {
  TagPage as default,
  TagPageGetStaticPaths as getStaticPaths,
} from '@wepublish/utils/website';

const TAKE = 25;

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { tag } = params || {};
  const client = getApiClient(getApiUrl(), []);

  const tagResult = await client.query<TagQuery>({
    query: TagDocument,
    variables: { tag, type: TagType.Article },
  });

  if (tagResult.error || !tagResult.data?.tag) {
    return { notFound: true, revalidate: 1 };
  }

  const topicTag = tagResult.data.tag;
  const tagId = topicTag.id;

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: { take: TAKE, skip: 0, filter: { tags: [tagId] } },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  // On topic pages the filter bar offers "topic ∩ chip" intersections. Prefetch a
  // 1-row availability probe for each whitelisted chip so EenewsTagPage can read the
  // counts cache-first and hide chips whose intersection would be empty. Probe the
  // whole whitelist (a superset of the rendered chips) so every rendered chip is covered.
  if (topicTag.main) {
    const tagListResult = await client.query<TagListQuery>({
      query: TagListDocument,
      variables: { take: 100 },
    });
    const candidateTagIds = resolveWhitelistTagIds(
      tagListResult.data?.tags?.nodes ?? []
    );

    await Promise.all(
      candidateTagIds.map(chipTagId =>
        client.query({
          query: ArticleListDocument,
          variables: {
            take: 1,
            skip: 0,
            filter: { tagsInclude: [tagId, chipTagId] },
          },
        })
      )
    );
  }

  const props = addClientCacheToProps(client, { tag: tag as string });

  return {
    props,
    revalidate: 60,
  };
};
