import {EventListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useEventListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  useWebsiteBuilder,
  BuilderEventListProps
} from '@wepublish/website/builder'

export type EventListContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<EventListQuery>, 'data' | 'loading' | 'error' | 'fetchMore'>
  ) => void
} & BuilderContainerProps &
  Pick<BuilderEventListProps, 'variables' | 'onVariablesChange'>

export function EventListContainer({
  onQuery,
  className,
  variables,
  onVariablesChange
}: EventListContainerProps) {
  const {EventList} = useWebsiteBuilder()
  const {data, loading, error, fetchMore} = useEventListQuery({
    variables
  })

  useEffect(() => {
    onQuery?.({data, loading, error, fetchMore})
  }, [data, loading, error, fetchMore, onQuery])

  return (
    <EventList
      data={data}
      loading={loading}
      error={error}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  )
}
