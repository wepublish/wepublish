import {QueryResult} from '@apollo/client'
import {NavigationListQuery} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'

export type BuilderNavbarProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
    className?: string
    slug: string
    categorySlugs: string[]
  }
>
