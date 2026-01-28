import {
  ArticleWithoutBlocksFragment,
  useArticleListQuery,
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
  };

export function ArticleListContainer({
  className,
  variables,
  onVariablesChange,
  filter,
}: ArticleListContainerProps) {
  const { ArticleList } = useWebsiteBuilder();
  const { data, loading, error } = useArticleListQuery({
    variables,
  });

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
