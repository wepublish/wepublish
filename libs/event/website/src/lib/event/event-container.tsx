import {useEventQuery, EventQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

export type EventContainerProps = {
  id: string
  onQuery?: (
    queryResult: Pick<QueryResult<EventQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function EventContainer({onQuery, id, className}: EventContainerProps) {
  const {Event} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useEventQuery({
    variables: {
      id
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return <Event data={data} loading={loading} error={error} className={className} />
}
