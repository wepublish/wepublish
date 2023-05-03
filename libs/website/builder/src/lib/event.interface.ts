import {QueryResult} from '@apollo/client'
import {EventQuery} from '@wepublish/website/api'

export type BuilderEventProps = Pick<QueryResult<EventQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}
