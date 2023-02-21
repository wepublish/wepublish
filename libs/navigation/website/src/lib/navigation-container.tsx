import {useNavigationListQuery, NavigationListQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {useWebsiteBuilder} from '@wepublish/website-builder'

export type NavigationContainerProps = {
  onQuery?: (
    queryResult: Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}

export function NavigationContainer({onQuery}: NavigationContainerProps) {
  const {Navigation} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useNavigationListQuery()

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return <Navigation data={data} loading={loading} error={error} />
}
