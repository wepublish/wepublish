import {QueryResult} from '@apollo/client'
import {FullImageFragment, NavigationListQuery} from '@wepublish/website/api'
import {PropsWithChildren, ReactNode} from 'react'

export type BuilderNavbarProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
    className?: string
    slug: string
    headerSlug: string
    categorySlugs: string[][]
    logo?: FullImageFragment | null
    loginUrl?: string
    profileUrl?: string
    subscriptionsUrl?: string | null
    actions?: ReactNode
  }
>
