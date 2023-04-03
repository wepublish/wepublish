import {useNavigationListQuery, NavigationListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export type NavbarContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}

export function NavbarContainer({onQuery}: NavbarContainerProps) {
  const {Navbar} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useNavigationListQuery()

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return <Navbar data={data} loading={loading} error={error} />
}
