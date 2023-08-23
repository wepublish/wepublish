import {useArticleListQuery} from '@wepublish/website/api'
import {
  BuilderArticleListProps,
  BuilderContainerProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

export type ArticleListContainerProps = BuilderContainerProps &
  Pick<BuilderArticleListProps, 'variables' | 'onVariablesChange'>

export function ArticleListContainer({
  className,
  variables,
  onVariablesChange
}: ArticleListContainerProps) {
  const {ArticleList} = useWebsiteBuilder()
  const {data, loading, error} = useArticleListQuery({
    variables
  })

  return (
    <ArticleList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
