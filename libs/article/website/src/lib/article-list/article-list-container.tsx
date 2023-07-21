import {ArticleListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useArticleListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  useWebsiteBuilder,
  BuilderArticleListProps
} from '@wepublish/website/builder'

export type ArticleListContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<ArticleListQuery>, 'data' | 'loading' | 'error' | 'fetchMore'>
  ) => void
} & BuilderContainerProps &
  BuilderArticleListProps

export function ArticleListContainer({onQuery, className, variables}: ArticleListContainerProps) {
  const {ArticleList} = useWebsiteBuilder()
  const {data, loading, error, fetchMore} = useArticleListQuery({
    variables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, fetchMore})
  }, [data, loading, error, fetchMore, onQuery])

  return (
    <ArticleList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
    />
  )
}
