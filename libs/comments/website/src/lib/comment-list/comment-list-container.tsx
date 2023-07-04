import {CommentListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useCommentListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  useWebsiteBuilder,
  BuilderCommentListProps
} from '@wepublish/website/builder'

export type CommentListContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<CommentListQuery>, 'data' | 'loading' | 'error' | 'fetchMore'>
  ) => void
} & BuilderContainerProps &
  Pick<BuilderCommentListProps, 'variables' | 'onVariablesChange'>

export function CommentListContainer({
  onQuery,
  className,
  variables,
  onVariablesChange
}: CommentListContainerProps) {
  const {CommentList} = useWebsiteBuilder()
  const {data, loading, error, fetchMore} = useCommentListQuery({
    variables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, fetchMore})
  }, [data, loading, error, fetchMore, onQuery])

  console.log(data)

  return (
    <CommentList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
