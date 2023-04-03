import {useNavigationQuery, NavigationQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {PropsWithChildren, useEffect} from 'react'
import {useWebsiteBuilder} from '@wepublish/website/builder'

export type FooterContainerProps = PropsWithChildren<{
  slug: string
  onQuery?: (
    queryResult: Pick<QueryResult<NavigationQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
}>

export function FooterContainer({onQuery, slug, children}: FooterContainerProps) {
  const {Footer} = useWebsiteBuilder()
  const {data, loading, error, refetch} = useNavigationQuery({
    variables: {
      slug
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return (
    <Footer data={data} loading={loading} error={error}>
      {children}
    </Footer>
  )
}
