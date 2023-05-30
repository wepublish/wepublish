import {QueryResult} from '@apollo/client'
import {PageQuery} from '@wepublish/website/api'

export type BuilderPageProps = Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
  className?: string
}
