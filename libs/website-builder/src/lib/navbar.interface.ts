import {QueryResult} from '@apollo/client'
import {NavigationListQuery} from '@wepublish/website/api'

export type BuilderNavbarProps = Pick<
  QueryResult<NavigationListQuery>,
  'data' | 'loading' | 'error'
> & {className?: string}
