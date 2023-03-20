import {QueryResult} from '@apollo/client'
import {NavigationQuery} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'

export type BuilderFooterProps = PropsWithChildren<
  Pick<QueryResult<NavigationQuery>, 'data' | 'loading' | 'error'> & {className?: string}
>
