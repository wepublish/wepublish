import {
  ArticleListQuery,
  RelatedArticleListQuery,
  SlimArticleFragment,
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
    filter?: (articles: SlimArticleFragment[]) => SlimArticleFragment[];
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
  const articleList = useArticleListQuery({
    variables,
    skip: !withTotalCount,
  });
  const relatedArticleList = useRelatedArticleListQuery({
    variables,
    skip: withTotalCount,
  });
  const data =
    withTotalCount ?
      articleList.data
    : normalizeArticleListData(relatedArticleList.data);
  const loading =
    withTotalCount ? articleList.loading : relatedArticleList.loading;
  const error = withTotalCount ? articleList.error : relatedArticleList.error;

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

const normalizeArticleListData = (
  data: RelatedArticleListQuery | undefined
): ArticleListQuery | undefined => {
  if (!data?.articles) {
    return data as ArticleListQuery | undefined;
  }

  return {
    ...data,
    articles: {
      ...data.articles,
      totalCount: data.articles.nodes.length,
    },
  };
};
