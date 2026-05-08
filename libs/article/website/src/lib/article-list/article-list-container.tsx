import {
  ArticleWithoutBlocksFragment,
  useArticleListQuery,
  useRelatedArticleListQuery,
} from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { useMemo } from 'react';

export type ArticleListContainerProps = BuilderContainerProps &
  Pick<BuilderArticleListProps, 'variables' | 'onVariablesChange'> & {
    filter?: (
      articles: ArticleWithoutBlocksFragment[]
    ) => ArticleWithoutBlocksFragment[];
    withTotalCount?: boolean;
  };

export function ArticleListContainer({
  className,
  variables,
  onVariablesChange,
  filter,
  withTotalCount = true,
}: ArticleListContainerProps) {
  const { ArticleList } = useWebsiteBuilder();
  const articleListResult = useArticleListQuery({
    variables,
    skip: !withTotalCount,
  });
  const relatedListResult = useRelatedArticleListQuery({
    variables,
    skip: withTotalCount,
  });
  const { data, loading, error } =
    withTotalCount ? articleListResult : relatedListResult;

  const filteredArticles = useMemo(
    () =>
      produce(data, draftData => {
        if (filter && draftData?.articles) {
          draftData.articles.nodes = filter(draftData.articles.nodes);
        }
      }),
    [data, filter]
  );

  return (
    <ArticleList
      data={filteredArticles}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );
}
