import { useQuery } from '@apollo/client/react';
import {
  ArticleContainer,
  ArticleListContainer,
} from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import { useQueryParams } from '@wepublish/utils/website/tanstack';
import { ArticleDocument, CommentItemType } from '@wepublish/website/api';

type ArticleIdentifier = { slug?: string; id?: string };

/**
 * Courant article view — renders related articles and comments bare, without
 * the shared `ArticlePage`'s H3 heading + `ArticleWrapper`. The courant
 * layout handles its own content measure, so an extra wrapper would narrow
 * those blocks below the article's own width.
 */
export function FactuelArticlePage() {
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
        <ArticleListContainer
          variables={{
            filter: { tags: data.article.tags.map(tag => tag.id) },
            take: 4,
          }}
          filter={articles =>
            articles
              .filter(article => article.id !== data.article?.id)
              .splice(0, 3)
          }
        />
      )}

      {data?.article && !data.article.disableComments && (
        <CommentListContainer
          id={data.article.id}
          type={CommentItemType.Article}
        />
      )}
    </>
  );
}
