import { useQuery } from '@apollo/client/react';
import {
  ArticleListDocument,
  SlimArticleFragment,
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
    filter?: (articles: SlimArticleFragment[]) => SlimArticleFragment[];
  };

export function ArticleListContainer({
  className,
  variables,
  onVariablesChange,
  filter,
}: ArticleListContainerProps) {
  const { ArticleList } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(ArticleListDocument, {
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
