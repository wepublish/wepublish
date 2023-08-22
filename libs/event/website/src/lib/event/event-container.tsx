import {QueryResult} from '@apollo/client'
import {EventQuery, useEventQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

export type EventContainerProps = {
  id: string
  onQuery?: (
    queryResult: Pick<QueryResult<EventQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function EventContainer({id, className}: EventContainerProps) {
  const {Event} = useWebsiteBuilder()
  const {data, loading, error} = useEventQuery({
    variables: {
      id
    }
  })

  return <Event data={data} loading={loading} error={error} className={className} />
}
