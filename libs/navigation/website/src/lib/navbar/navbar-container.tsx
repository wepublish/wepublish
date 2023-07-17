import {useNavigationListQuery, NavigationListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {PropsWithChildren, useEffect} from 'react'
import {
  BuilderContainerProps,
  BuilderNavbarProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'

export type NavbarContainerProps = PropsWithChildren<
  Pick<BuilderNavbarProps, 'categorySlugs' | 'slug'> & {
    onQuery?: (
      queryResult: Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
    ) => void
  } & BuilderContainerProps
>

export function NavbarContainer({
  onQuery,
  className,
  categorySlugs,
  slug,
  children
}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useNavigationListQuery()

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <Navbar
      categorySlugs={categorySlugs}
      slug={slug}
      data={data}
      loading={loading}
      error={error}
      className={className}>
      {children}
    </Navbar>
  )
}
