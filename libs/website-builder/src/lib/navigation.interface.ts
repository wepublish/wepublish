import {QueryResult} from '@apollo/client'
import {NavigationListQuery} from '@wepublish/website/api'

export type BuilderNavigationProps = Pick<
  QueryResult<NavigationListQuery>,
  'data' | 'loading' | 'error'
>
