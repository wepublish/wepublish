import {QueryResult} from '@apollo/client'
import {FullImageFragment, NavigationListQuery} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'

export type BuilderNavbarProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
    className?: string
    slug: string
    categorySlugs: string[][]
    logo?: FullImageFragment | null
  }
>
