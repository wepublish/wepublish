import {QueryResult} from '@apollo/client'
import {PollBlockProvider} from '@wepublish/block-content/website'
import {PageQuery, usePageQuery} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'

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

  return (
    <PollBlockProvider>
      <Page data={data} loading={loading} error={error} className={className} />
    </PollBlockProvider>
  )
}
