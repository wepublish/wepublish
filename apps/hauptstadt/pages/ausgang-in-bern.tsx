import { ArticleWrapper } from '@wepublish/article/website';
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  ArticleListDocument,
  ArticleSort,
  CommentListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  SortOrder,
  Tag,
  TagListDocument,
  TagType,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';

import { TAG_ARCHIVIERT, TAG_NACHTLEBEN } from '../src/archiviert';
import { StandaloneArticlePage } from '../src/components/standalone-article-page';

type AusgangInBernProps = {
  articleId: string | null;
};

export default function AusgangInBern({ articleId }: AusgangInBernProps) {
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  if (!articleId) {
    return (
      <ArticleWrapper>
        <Paragraph>
          Zurzeit ist kein Nachtleben-Artikel verfügbar. Schau später wieder
          vorbei.
        </Paragraph>
      </ArticleWrapper>
    );
  }

  return <StandaloneArticlePage id={articleId} />;
}

export const getStaticProps: GetStaticProps<AusgangInBernProps> = async () => {
  const client = getApiClient(getApiUrl(), []);

  const [tagList] = await Promise.all([
    client.query({
      query: TagListDocument,
      variables: {
        filter: {
          tags: [TAG_NACHTLEBEN, TAG_ARCHIVIERT],
          type: TagType.Article,
        },
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const tags: Tag[] = tagList.data?.tags?.nodes ?? [];
  const nachtlebenTag = tags.find(
    ({ tag }) => tag?.toLowerCase() === TAG_NACHTLEBEN
  );
  const archiviertTag = tags.find(
    ({ tag }) => tag?.toLowerCase() === TAG_ARCHIVIERT
  );

  let articleId: string | null = null;

  if (nachtlebenTag) {
    const articleList = await client.query({
      query: ArticleListDocument,
      variables: {
        take: 1,
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        filter: {
          tags: [nachtlebenTag.id],
          ...(archiviertTag ? { tagsNotIn: [archiviertTag.id] } : {}),
        },
      },
    });

    articleId = articleList.data?.articles?.nodes?.[0]?.id ?? null;
  }

  if (articleId) {
    // prime the same caches as /a/[slug] so StandaloneArticlePage renders
    // identically without any client-side fetches
    const article = await client.query({
      query: ArticleDocument,
      variables: {
        id: articleId,
      },
    });

    if (article.data?.article) {
      await Promise.all([
        client.query({
          query: ArticleListDocument,
          variables: {
            filter: {
              tags: article.data.article.tags.map((tag: Tag) => tag.id),
            },
            take: 4,
          },
        }),
        client.query({
          query: CommentListDocument,
          variables: {
            itemId: article.data.article.id,
          },
        }),
      ]);
    } else {
      articleId = null;
    }
  }

  const props = addClientCacheToProps(client, { articleId });

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
