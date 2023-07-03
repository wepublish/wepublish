import {AuthorListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useAuthorListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  useWebsiteBuilder,
  BuilderAuthorListProps
} from '@wepublish/website/builder'

export type AuthorListContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<AuthorListQuery>, 'data' | 'loading' | 'error' | 'fetchMore'>
  ) => void
} & BuilderContainerProps &
  Pick<BuilderAuthorListProps, 'variables' | 'onVariablesChange'>

export function AuthorListContainer({
  onQuery,
  className,
  variables,
  onVariablesChange
}: AuthorListContainerProps) {
  const {AuthorList} = useWebsiteBuilder()
  const {data, loading, error, fetchMore} = useAuthorListQuery({
    variables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, fetchMore})
  }, [data, loading, error, fetchMore, onQuery])

  return (
    <AuthorList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
