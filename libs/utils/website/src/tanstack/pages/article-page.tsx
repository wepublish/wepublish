import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ArticleContainer,
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import {
  ArticleDocument,
  ArticleListDocument,
  ArticleQuery,
  CommentItemType,
  CommentListDocument,
  FullTagFragment,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { useQueryParams } from '../router-hooks';

export type ArticleIdentifier = { slug?: string; id?: string };

/** `pages/a/[slug].tsx`'s and `pages/a/id/[id].tsx`'s shared `getStaticProps`. */
export const prefetchArticle = (
  client: ApolloClient,
  variables: ArticleIdentifier
) =>
  client.query<ArticleQuery>({
    query: ArticleDocument,
    variables,
  });

/** Related articles and comments — only fetched once the article resolved. */
export const prefetchArticleExtras = async (
  client: ApolloClient,
  article: ArticleQuery['article'] | undefined,
  { relatedTake = 4 } = {}
) => {
  if (!article) {
    return;
  }

  await Promise.all([
    client.query({
      query: ArticleListDocument,
      variables: {
        filter: { tags: article.tags.map((tag: FullTagFragment) => tag.id) },
        take: relatedTake,
      },
    }),
    client.query({
      query: CommentListDocument,
      variables: { itemId: article.id },
    }),
  ]);
};

export type ArticlePageProps = {
  /** Heading above the related-articles list. Pass `null` to hide the block. */
  relatedTitle?: string | null;
  /** Heading above the comment list. Pass `null` to hide the block. */
  commentsTitle?: string | null;
  relatedTake?: number;
  relatedShown?: number;
};

/**
 * Single article view, addressed by `slug` or `id` depending on which route
 * mounted it — both come through the merged route params.
 */
export function ArticlePage({
  relatedTitle = 'Das könnte dich auch interessieren',
  commentsTitle = 'Kommentare',
  relatedTake = 4,
  relatedShown = 3,
}: ArticlePageProps) {
  const {
    elements: { H3 },
  } = useWebsiteBuilder();

  const { slug, id } = useQueryParams() as ArticleIdentifier;

  const { data } = useQuery(ArticleDocument, {
    fetchPolicy: 'cache-only',
    variables: { slug, id },
  });

  return (
    <>
      <ArticleContainer
        slug={slug as never}
        id={id as never}
      />

      {data?.article && (
        <>
          {relatedTitle !== null && (
            <ArticleWrapper>
              <H3 component={'h2'}>{relatedTitle}</H3>
              <ArticleListContainer
                variables={{
                  filter: { tags: data.article.tags.map(tag => tag.id) },
                  take: relatedTake,
                }}
                filter={articles =>
                  articles
                    .filter(article => article.id !== data.article?.id)
                    .splice(0, relatedShown)
                }
              />
            </ArticleWrapper>
          )}

          {commentsTitle !== null && !data.article.disableComments && (
            <ArticleWrapper>
              <H3 component={'h2'}>{commentsTitle}</H3>
              <CommentListContainer
                id={data.article.id}
                type={CommentItemType.Article}
              />
            </ArticleWrapper>
          )}
        </>
      )}
    </>
  );
}
