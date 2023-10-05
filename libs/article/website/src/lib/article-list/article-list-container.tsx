import {FullArticleFragment, useArticleListQuery} from '@wepublish/website/api'
import {
  BuilderArticleListProps,
  BuilderContainerProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

export type ArticleListContainerProps = BuilderContainerProps &
  Pick<BuilderArticleListProps, 'variables' | 'onVariablesChange'> & {
    filter?: (articles: FullArticleFragment[]) => FullArticleFragment[]
  }

export function ArticleListContainer({
  className,
  variables,
  onVariablesChange,
  filter
}: ArticleListContainerProps) {
  const {ArticleList} = useWebsiteBuilder()
  const {data, loading, error} = useArticleListQuery({
    variables
  })

  return (
    <ArticleList
      data={
        filter && data?.articles
          ? {
              ...data,
              articles: {
                pageInfo: data.articles.pageInfo,
                totalCount: data.articles.totalCount,
                nodes: filter(data.articles.nodes)
              }
            }
          : data
      }
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
