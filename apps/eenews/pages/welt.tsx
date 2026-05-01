import { ContentWidthProvider } from '@wepublish/content/website';
import { PageContainer } from '@wepublish/page/website';
import {
  addClientCacheToV1Props,
  ArticleListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PageDocument,
  PeerProfileDocument,
  TagListDocument,
  TagSort,
  TagType,
} from '@wepublish/website/api';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

export default function Welt() {
  return (
    <ContentWidthProvider fullWidth>
      <PageContainer slug="welt" />
    </ContentWidthProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  await Promise.all([
    client.query({
      query: PageDocument,
      variables: { slug: 'welt' },
    }),
    client.query({ query: NavigationListDocument }),
    client.query({ query: PeerProfileDocument }),
  ]);

  // Pre-fetch topic-strip tags + per-tag counts (see eenews-system-design.md
  // Section 10.5).
  const tagListResult = await client.query({
    query: TagListDocument,
    variables: {
      filter: { type: TagType.Article },
      sort: TagSort.Tag,
      take: 50,
    },
  });
  const allTags = (tagListResult.data?.tags?.nodes ?? []) as Array<{
    id: string;
    main?: boolean | null;
  }>;
  const mainTagIds = allTags
    .filter(t => t.main)
    .slice(0, 4)
    .map(t => t.id);
  const stripTagIds =
    mainTagIds.length > 0 ? mainTagIds : allTags.slice(0, 4).map(t => t.id);
  await Promise.all(
    stripTagIds.map(id =>
      client.query({
        query: ArticleListDocument,
        variables: { filter: { tags: [id] }, take: 0 },
      })
    )
  );

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60,
  };
};
