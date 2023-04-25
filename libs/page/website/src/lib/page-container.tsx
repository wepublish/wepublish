import {usePageQuery, PageQuery} from '@wepublish/website/api'
import {QueryResult} from '@apollo/client'
import {useEffect} from 'react'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'

type IdOrSlug = {id: string; slug?: never} | {id?: never; slug: string}

export type PageContainerProps = IdOrSlug & {
  onQuery?: (
    queryResult: Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void
} & BuilderContainerProps

export function PageContainer({onQuery, id, slug, className}: PageContainerProps) {
  const {Page} = useWebsiteBuilder()
  const {data, loading, error, refetch} = usePageQuery({
    variables: {
      id,
      slug
    }
  })

  useEffect(() => {
    onQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onQuery])

  return <Page data={data} loading={loading} error={error} className={className} />
}
